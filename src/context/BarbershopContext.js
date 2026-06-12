import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { publicUrl, removeStoredImage, uploadBarbershopImage } from '../lib/storage';
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
    appointmentCapacity: row.appointment_capacity ?? 1,
    rating: row.rating,
    location:
      row.latitude != null ? { latitude: row.latitude, longitude: row.longitude } : null,
    horarios: rowsParaHorarios(row.business_hours ?? []),
    products: (row.services ?? []).map((s) => ({ id: s.id, name: s.name, price: s.price })),
  };
}

export function BarbershopProvider({ children }) {
  const [barbershops, setBarbershops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBarbershops = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('barbershops')
      .select('*, services(*), business_hours(*)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
      return;
    }
    setBarbershops((data ?? []).map(mapBarbershop));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBarbershops();
  }, [fetchBarbershops]);

  const addBarbershop = async (barbershop) => {
    const { data, error } = await supabase
      .from('barbershops')
      .insert({
        owner_id: barbershop.owner,
        name: barbershop.name,
        description: barbershop.description,
        address: barbershop.endereco,
        duration_minutes: Number(barbershop.duracaoAgendamento) || 30,
        appointment_capacity: Math.max(1, Number(barbershop.appointmentCapacity) || 1),
        latitude: barbershop.location?.latitude,
        longitude: barbershop.location?.longitude,
      })
      .select()
      .single();
    if (error) {
      console.error('Erro ao criar barbearia:', error);
      return {
        barbershopCreated: false,
        hoursSaved: false,
        message: error.message,
      };
    }

    let imageError = null;
    if (barbershop.imageUri) {
      try {
        const { path } = await uploadBarbershopImage(data.id, barbershop.imageUri);
        const { error: imageUpdateError } = await supabase
          .from('barbershops')
          .update({ image_path: path })
          .eq('id', data.id);
        if (imageUpdateError) {
          await removeStoredImage('barbershops', path).catch(console.error);
          imageError = imageUpdateError;
        }
      } catch (error) {
        imageError = error;
      }
    }

    const { error: hoursError } = await supabase
      .from('business_hours')
      .insert(horariosParaRows(data.id, barbershop.horarios));

    if (hoursError) {
      console.error('Erro ao salvar horários da barbearia:', hoursError);
    }

    await fetchBarbershops();

    return {
      barbershopCreated: true,
      hoursSaved: !hoursError,
      imageSaved: !imageError,
      barbershopId: data.id,
      message: hoursError?.message,
      imageMessage: imageError?.message,
    };
  };

  const updateBarbershop = async (id, updatedData) => {
    const patch = {
      name: updatedData.name,
      description: updatedData.description,
      address: updatedData.endereco,
      latitude: updatedData.location?.latitude,
      longitude: updatedData.location?.longitude,
      duration_minutes: Number(updatedData.duracaoAgendamento) || 30,
      appointment_capacity: Math.max(1, Number(updatedData.appointmentCapacity) || 1),
    };

    let previousImagePath = null;
    let uploadedImagePath = null;

    if (updatedData.imageUri && !updatedData.imageUri.startsWith('http')) {
      const { data: currentBarber, error: currentImageError } = await supabase
        .from('barbershops')
        .select('image_path')
        .eq('id', id)
        .single();

      if (currentImageError) {
        return {
          barbershopUpdated: false,
          hoursSaved: false,
          message: currentImageError.message,
        };
      }

      previousImagePath = currentBarber?.image_path ?? null;
      try {
        const { path } = await uploadBarbershopImage(id, updatedData.imageUri);
        uploadedImagePath = path;
        patch.image_path = path;
      } catch (error) {
        return {
          barbershopUpdated: false,
          hoursSaved: false,
          message: error.message,
        };
      }
    }

    const { error: barbershopError } = await supabase
      .from('barbershops')
      .update(patch)
      .eq('id', id);

    if (barbershopError) {
      if (uploadedImagePath) {
        await removeStoredImage('barbershops', uploadedImagePath).catch(console.error);
      }
      console.error('Erro ao atualizar barbearia:', barbershopError);
      return {
        barbershopUpdated: false,
        hoursSaved: false,
        message: barbershopError.message,
      };
    }

    if (uploadedImagePath && previousImagePath) {
      await removeStoredImage('barbershops', previousImagePath).catch((error) => {
        console.error('Erro ao remover imagem anterior da barbearia:', error);
      });
    }

    const { error: hoursError } = await supabase
      .from('business_hours')
      .upsert(horariosParaRows(id, updatedData.horarios), {
        onConflict: 'barbershop_id,weekday',
      });

    if (hoursError) {
      console.error('Erro ao atualizar horários da barbearia:', hoursError);
    }

    await fetchBarbershops();

    return {
      barbershopUpdated: true,
      hoursSaved: !hoursError,
      message: hoursError?.message,
    };
  };

  const addProduct = async (barbershopId, product) => {
    const { error } = await supabase
      .from('services')
      .insert({ barbershop_id: barbershopId, name: product.name, price: product.price });
    if (error) return { success: false, message: error.message };
    await fetchBarbershops();
    return { success: true };
  };

  const updateProduct = async (barbershopId, productId, changes) => {
    const { error } = await supabase
      .from('services')
      .update({ name: changes.name, price: changes.price })
      .eq('id', productId)
      .eq('barbershop_id', barbershopId);
    if (error) return { success: false, message: error.message };
    await fetchBarbershops();
    return { success: true };
  };

  const deleteProduct = async (barbershopId, productId) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', productId)
      .eq('barbershop_id', barbershopId);
    if (error) return { success: false, message: error.message };
    await fetchBarbershops();
    return { success: true };
  };

  const value = {
    barbershops,
    loading,
    error,
    addBarbershop,
    updateBarbershop,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchBarbershops,
  };

  return <BarbershopContext.Provider value={value}>{children}</BarbershopContext.Provider>;
}

export function useBarbershops() {
  const context = useContext(BarbershopContext);
  if (!context) {
    throw new Error('useBarbershops deve ser usado dentro de um BarbershopProvider');
  }
  return context;
}
