import React from "react";
import { useNavigate } from "react-router-dom";

function Cart({ cart, setCart }) {
  const navigate = useNavigate();

  const removeFromCart = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  return (
    <div className="cart-container">
      <h2 className="cart-title">Your Cart</h2>
      {cart.length === 0 ? (
        <p className="empty-cart-text">Your cart is empty.</p>
      ) : (
        cart.map((item, index) => (
          <div key={index} className="cart-item">
            <img src={item.prodURL} alt={item.prodTitle} className="cart-item-image" />
            <div className="cart-item-details">
              <h3 className="cart-item-title">{item.prodTitle}</h3>
              <p className="cart-item-description">{item.prodDesc}</p>
              <button className="remove-btn" onClick={() => removeFromCart(index)}>
                Remove
              </button>
            </div>
          </div>
        ))
      )}
      {cart.length > 0 && (
        <div className="cart-checkout">
          <button className="checkout-btn" onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;
