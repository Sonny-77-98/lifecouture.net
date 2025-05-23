import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../style/ProductList.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categories, setCategories] = useState([]);

  const statusOptions = useMemo(() => [
    'active',
    'inactive',
  ], []);

  const handleMarkInactive = async (id) => {
    try {
      await axios.patch(`/api/products/${id}/status`, { status: 'inactive' });
      setProducts(prevProducts => prevProducts.map(product => 
        product.prodID === id ? {...product, prodStat: 'inactive'} : product
      ));
    } catch (err) {
      console.error('Error marking product as inactive:', err);
      setError('Failed to mark product as inactive. Please try again.');
    }
  };
  
  const handleMarkActive = async (id) => {
    try {
      await axios.patch(`/api/products/${id}/status`, { status: 'active' });
      setProducts(prevProducts => prevProducts.map(product => 
        product.prodID === id ? {...product, prodStat: 'active'} : product
      ));
    } catch (err) {
      console.error('Error marking product as active:', err);
      setError('Failed to mark product as active. Please try again.');
    }
  };
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/products';
      const params = [];
      
      if (categoryFilter) {
        params.push(`category=${categoryFilter}`);
      }
      
      if (statusFilter) {
        params.push(`status=${statusFilter}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      console.log('Fetching products from:', url);

      const productsResponse = await axios.get(url);
      console.log('Products response:', productsResponse.data);

      const productsData = Array.isArray(productsResponse.data) 
        ? productsResponse.data 
        : [];
      
      setProducts(productsData);
      
      const categoriesResponse = await axios.get('/api/categories');
      
      const categoriesData = Array.isArray(categoriesResponse.data)
        ? categoriesResponse.data
        : [];
        
      setCategories(categoriesData);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err.message}`);
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleDelete = useCallback(async (id) => {
    if (window.confirm(
      'Are you sure you want to delete this product? This action cannot be undone.\n\n' +
      'Note: Products that have been ordered cannot be deleted and should be marked as inactive instead.'
    )) {
      try {
        await axios.delete(`/api/products/${id}`);
        setProducts(prevProducts => prevProducts.filter(product => product.prodID !== id));
      } catch (err) {
        console.error('Error deleting product:', err);
        
        if (err.response?.status === 400 && err.response.data?.message) {
          alert(err.response.data.message);
        } else {
          setError('Failed to delete product. Please try again.');
        }
      }
    }
  }, []);
  
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(product => 
      (product.prodTitle && product.prodTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.prodDesc && product.prodDesc.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);
  
  const getProductImage = useCallback((product) => {
    if (product.prodURL) {
      return product.prodURL;
    }
    return "https://i.imgur.com/O4L5Wbf.jpeg"; // Default image
  }, []);
  
  const renderStatus = useCallback((status) => {
    const statusClass = `status-badge status-${status || 'active'}`;
    const displayStatus = (status || 'active').charAt(0).toUpperCase() + (status || 'active').slice(1).replace('_', ' ');
    
    return (
      <span className={statusClass}>
        {displayStatus}
      </span>
    );
  }, []);
  
  if (loading) {
    return (
      <div className="product-list-container">
        <div className="loading-indicator">Loading products...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="product-list-container">
        <div className="error-message">
          <h3>Error Loading Products</h3>
          <p>{error}</p>
          <button 
            onClick={fetchData}
            className="reload-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h2>Product Management</h2>
        <Link to="/admin/products/add" className="add-product-button">
          Add New Product
        </Link>
      </div>
      
      <div className="filters-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={category.catID || index} value={category.catID}>
                  {category.catName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="note-message">
      <p>Note: You can change a product's status directly using the dropdown in the Status column.</p>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="no-products-found">
          <p>No products found matching your criteria.</p>
        </div>
      ) : (
        <div className="product-table-container">
          <table className="product-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Product Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.prodID || index}>
                  <td>{product.prodID}</td>
                  <td className="product-image-cell">
                    <div className="product-thumbnail">
                      <img 
                        src={getProductImage(product)} 
                        alt={product.prodTitle || 'Product'} 
                        onError={(e) => {e.target.src = "https://i.imgur.com/O4L5Wbf.jpeg"}}
                      />
                    </div>
                  </td>
                  <td className="product-name-cell">{product.prodTitle}</td>
                  <td className="product-description-cell">
                    {product.prodDesc && product.prodDesc.length > 60 
                      ? `${product.prodDesc.substring(0, 60)}...` 
                      : product.prodDesc}
                  </td>
                  <td className="status-cell">
                    <select
                      value={product.prodStat || 'active'}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        if (newStatus === 'active') {
                          handleMarkActive(product.prodID);
                        } else if (newStatus === 'inactive') {
                          handleMarkInactive(product.prodID);
                        }
                      }}
                      className={`status-select status-${product.prodStat || 'active'}`}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="actions-cell">
                    <Link 
                      to={`/admin/products/edit/${product.prodID}`}
                      className="edit-button"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.prodID)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="back-to-dashboard">
        <Link to="/admin/dashboard">← Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default ProductList;