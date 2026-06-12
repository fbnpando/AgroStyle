import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);         // { product, qty }
  const [isOpen, setIsOpen] = useState(false);

  const producerId   = items[0]?.product.producerId   || null;
  const producerName = items[0]?.product.producerName || null;
  const total = items.reduce((sum, { product, qty }) => sum + Number(product.price) * qty, 0);
  const count = items.reduce((sum, { qty }) => sum + qty, 0);

  const addItem = useCallback((product, qty) => {
    // Restrict to 1 producer
    if (items.length > 0 && product.producerId !== producerId) {
      return { error: `El carrito ya tiene productos de ${producerName}. Vacía el carrito para agregar de otro productor.` };
    }
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty };
        return updated;
      }
      return [...prev, { product, qty }];
    });
    return { error: null };
  }, [items, producerId, producerName]);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => i.product.id === productId ? { ...i, qty } : i)
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{
      items, total, count, producerId, producerName,
      addItem, removeItem, updateQty, clearCart,
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}
