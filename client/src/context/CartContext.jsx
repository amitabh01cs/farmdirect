import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const localData = localStorage.getItem('cart');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Derived properties
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartFarmerId = cartItems.length > 0 ? cartItems[0].farmer : null;
  const cartFarmName = cartItems.length > 0 ? cartItems[0].farmName : null;

  const addToCart = (product, quantity = 1) => {
    // Enforce single-farmer checkout constraint
    if (cartItems.length > 0 && cartItems[0].farmer !== product.farmer) {
      return {
        success: false,
        message: `You can only add items from one farm at a time (currently: "${cartFarmName}"). Clear your cart first to order from a different farm.`
      };
    }

    let updatedCart = [...cartItems];
    const existingIndex = updatedCart.findIndex((item) => item.product === product._id);

    if (existingIndex > -1) {
      const newQty = updatedCart[existingIndex].quantity + quantity;
      if (newQty > product.quantityAvailable) {
        return {
          success: false,
          message: `Cannot add more. Only ${product.quantityAvailable} ${product.unit} available in stock.`
        };
      }
      updatedCart[existingIndex].quantity = newQty;
    } else {
      if (quantity > product.quantityAvailable) {
        return {
          success: false,
          message: `Cannot add. Only ${product.quantityAvailable} ${product.unit} available in stock.`
        };
      }
      updatedCart.push({
        product: product._id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        quantity: quantity,
        farmer: product.farmer._id || product.farmer,
        farmName: product.farmName || 'Local Farm',
        imageUrl: product.imageUrl,
        stock: product.quantityAvailable
      });
    }

    setCartItems(updatedCart);
    return { success: true };
  };

  const updateQuantity = (productId, quantity) => {
    const updatedCart = cartItems.map((item) => {
      if (item.product === productId) {
        const targetQty = Math.max(1, quantity);
        if (targetQty > item.stock) {
          return item; // fail silently or cap it
        }
        return { ...item, quantity: targetQty };
      }
      return item;
    });
    setCartItems(updatedCart);
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        cartFarmerId,
        cartFarmName,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
