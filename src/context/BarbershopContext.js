import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { publicUrl, uploadBarbershopImage } from '../lib/storage';
import { horariosParaRows, rowsParaHorarios } from '../utils/horarios';

const BarbershopContext = createContext(undefined);

function mapBarbershop(row) {
  return {
    id: row.id,
    owner: row.owner_id,
    name: row.name,
    description: row.description,
    endereco: row.address,
    imageUri: publicUrl('barbershops', row.image_path),
    duracaoAgendamento: row.duration_minutes,
    rating: row.rating,
    location:
      row.latitude != null ? { latitude: row.latitude, longitude: row.longitude } : null,
    horarios: rowsParaHorarios(row.business_hours ?? []),
    products: (row.services ?? []).map((s) => ({ id: s.id, name: s.name, price: s.price })),
  };
}

export function BarbershopProvider({ children }) {
  const [barbershops, setBarbershops] = useState([]);

  const fetchBarbershops = async () => {
    const { data, error } = await supabase
      .from('barbershops')
      .select('*, services(*), business_hours(*)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    setBarbershops((data ?? []).map(mapBarbershop));
  };

  useEffect(() => {
    fetchBarbershops();
  }, []);

  const addBarbershop = async (barbershop) => {
    const { data, error } = await supabase
      .from('barbershops')
      .insert({
        owner_id: barbershop.owner,
        name: barbershop.name,
        description: barbershop.description,
        address: barbershop.endereco,
        duration_minutes: Number(barbershop.duracaoAgendamento) || 30,
        latitude: barbershop.location?.latitude,
        longitude: barbershop.location?.longitude,
      })
      .select()
      .single();
    if (error) {
      alert(error.message);
      return;
    }

    if (barbershop.imageUri) {
      const { path } = await uploadBarbershopImage(data.id, barbershop.imageUri);
      await supabase.from('barbershops').update({ image_path: path }).eq('id', data.id);
    }

    await supabase.from('business_hours').insert(horariosParaRows(data.id, barbershop.horarios));
    await fetchBarbershops();
  };

  const updateBarbershop = async (id, updatedData) => {
    const patch = {
      name: updatedData.name,
      description: updatedData.description,
      address: updatedData.endereco,
      latitude: updatedData.location?.latitude,
      longitude: updatedData.location?.longitude,
    };

    if (updatedData.imageUri && !updatedData.imageUri.startsWith('http')) {
      const { path } = await uploadBarbershopImage(id, updatedData.imageUri);
      patch.image_path = path;
    }

    await supabase.from('barbershops').update(patch).eq('id', id);

    if (updatedData.horarios) {
      await supabase.from('business_hours').delete().eq('barbershop_id', id);
      await supabase.from('business_hours').insert(horariosParaRows(id, updatedData.horarios));
    }

    await fetchBarbershops();
  };

  const addProduct = async (barbershopId, product) => {
    await supabase
      .from('services')
      .insert({ barbershop_id: barbershopId, name: product.name, price: product.price });
    await fetchBarbershops();
  };

  const updateProduct = async (barbershopId, productId, changes) => {
    await supabase
      .from('services')
      .update({ name: changes.name, price: changes.price })
      .eq('id', productId);
    await fetchBarbershops();
  };

  const deleteProduct = async (barbershopId, productId) => {
    await supabase.from('services').delete().eq('id', productId);
    await fetchBarbershops();
  };

  const value = useMemo(
    () => ({
      barbershops,
      addBarbershop,
      updateBarbershop,
      addProduct,
      updateProduct,
      deleteProduct,
      refetch: fetchBarbershops,
    }),
    [barbershops]
  );

  return <BarbershopContext.Provider value={value}>{children}</BarbershopContext.Provider>;
}

export function useBarbershops() {
  const context = useContext(BarbershopContext);
  if (!context) {
    throw new Error('useBarbershops deve ser usado dentro de um BarbershopProvider');
  }
  return context;
}
