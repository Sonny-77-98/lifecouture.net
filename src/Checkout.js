import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Checkout({ cart, setCart }) {
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    state: ""
  });
  const [variants, setVariants] = useState({});
  const [states, setStates] = useState([]);
  const [taxRate, setTaxRate] = useState(0);  // Tax rate as a decimal
  const [shippingCost] = useState(6.99); // Static shipping cost

  const navigate = useNavigate();

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const productVariants = await Promise.all(
          cart.map(async (item) => {
            const response = await fetch(`http://localhost:3001/api/variants/${item.prodID}`);
            if (!response.ok) throw new Error(`Error fetching variants for prodID ${item.prodID}`);
            const data = await response.json();
            return { prodID: item.prodID, variants: data };
          })
        );
        const grouped = productVariants.reduce((acc, { prodID, variants }) => {
          acc[prodID] = variants;
          return acc;
        }, {});
        setVariants(grouped);
      } catch (error) {
        console.error("Error fetching variants:", error);
      }
    };

    const fetchStates = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/states");
        const data = await response.json();
        setStates(data);
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };

    fetchStates();
    if (cart.length > 0) {
      fetchVariants();
    }
  }, [cart]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));

    if (name === "state") {
      const selectedState = states.find(s => s.stateName === value);
      setTaxRate(selectedState ? selectedState.taxRatesA / 100 : 0); // Ensure taxRate is a decimal
    }
  };

  const handleVariantChange = (index, varID) => {
    const updatedCart = [...cart];
    updatedCart[index].varID = varID;
    setCart(updatedCart);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const prodVariants = variants[item.prodID] || [];
      const selectedVariant = prodVariants.find(v => String(v.varID) === String(item.varID));
      if (!selectedVariant) return total;
      const price = parseFloat(selectedVariant.varPrice);
      const quantity = item.quantity || 1;
      return isNaN(price) ? total : total + price * quantity;
    }, 0);
  };

  const placeOrder = async () => {
    const { name, email, phone, address, state } = customerInfo;

    if (!name || !email || !phone || !address || !state) {
      alert("Please fill in all fields including state.");
      return;
    }

    if (cart.some(item => !item.varID)) {
      alert("Please select a variant for each product.");
      return;
    }

    const subtotal = calculateSubtotal();
    const tax = subtotal * taxRate;  // Apply tax rate as decimal
    const totalAmount = subtotal + tax + shippingCost;

    const orderData = {
      items: cart.map(item => ({
        prodID: item.prodID,
        varID: item.varID,
        quantity: item.quantity
      })),
      subtotal,
      taxRate,
      shippingCost,
      totalAmount,
      name,
      email,
      phone,
      address
    };

    try {
      const response = await fetch("http://localhost:3001/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      if (response.ok) {
        alert("Order placed successfully!");
        setCart([]);
        navigate("/");
      } else {
        alert("Error placing order: " + data.error);
      }
    } catch (error) {
      alert("Error placing order: " + error.message);
    }
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * taxRate;  // Correct tax calculation using taxRate as a decimal
  const grandTotal = subtotal + tax + shippingCost;

  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Checkout</h2>

      <div className="checkout-items">
        {cart.map((item, index) => {
          const productVariants = variants[item.prodID] || [];
          return (
            <div key={index} className="checkout-item">
              <img src={item.prodURL} alt={item.prodTitle} className="checkout-item-image" />
              <div className="checkout-item-details">
                <p className="checkout-item-title">{item.prodTitle}</p>
                <p className="checkout-item-description">{item.prodDesc}</p>
                {productVariants.length > 0 ? (
                  <select
                    value={item.varID || ""}
                    onChange={(e) => handleVariantChange(index, e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select a variant</option>
                    {productVariants.map(variant => (
                      <option key={variant.varID} value={variant.varID}>
                        SKU: {variant.varSKU} | Price: ${variant.varPrice || "N/A"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p>No variants available for this product.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="customer-info">
        <input type="text" name="name" placeholder="Full Name" value={customerInfo.name} onChange={handleInputChange} className="input-field" />
        <input type="email" name="email" placeholder="Email" value={customerInfo.email} onChange={handleInputChange} className="input-field" />
        <input type="tel" name="phone" placeholder="Phone Number" value={customerInfo.phone} onChange={handleInputChange} className="input-field" />
        <textarea name="address" placeholder="Shipping Address" value={customerInfo.address} onChange={handleInputChange} className="textarea-field" />

        <select name="state" value={customerInfo.state} onChange={handleInputChange} className="input-field">
          <option value="">Select State</option>
          {states.map((state, index) => (
            <option key={index} value={state.stateName}>{state.stateName}</option>
          ))}
        </select>
      </div>

      <div className="checkout-summary">
        <h3>Order Summary</h3>
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>Tax ({(taxRate * 100).toFixed(2)}%): ${tax.toFixed(2)}</p>
        <p>Shipping Fee: ${shippingCost.toFixed(2)}</p>
        <p><strong>Total: ${grandTotal.toFixed(2)}</strong></p>
      </div>

      <button onClick={placeOrder} className="place-order-btn">Place Order</button>
    </div>
  );
}

export default Checkout;
