import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [productList, setProductList] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/products')
      .then((response) => response.json())
      .then((data) => {
        console.log('Fetched products:', data);
        setProductList(data);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
      });
  }, []);

  return (
    <div className="container">
      <div className="navbar">
        <div className="logo">Life Couture</div>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/cart">Cart</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </div>
      </div>
      <div className="hero">
        <h1>Welcome to Life Couture</h1>
        <p>Your one-stop shop for fitness gear!</p>
      </div>
      <div className="products">
        {productList.length === 0 ? (
          <div>Loading products...</div>
        ) : (
          productList.map((product) => (
            <div className="product-card" key={product.prodID}>
              <div className="product-image">
                <img
                  src={product.prodURL}
                  alt={product.prodTitle}
                  onError={(e) => (e.target.src = 'https://i.imgur.com/defaultImage.jpg')}
                />
              </div>
              <div>{product.prodTitle}</div>
              <div>{product.prodDesc}</div>
              <div>{product.prodStat}</div>
              <button>Add to cart</button>
            </div>
          ))
        )}
      </div>
      <div className="footer">
        <p>&copy; 2025 Life Couture. All rights reserved.</p>
      </div>
    </div>
  );
}

export default App;
