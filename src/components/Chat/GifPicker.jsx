import React, { useState, useEffect, useRef } from 'react';

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || '';

export default function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchGifs('');
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const fetchGifs = async (searchTerm) => {
    if (!GIPHY_KEY) {
      setGifs([]);
      return;
    }
    setLoading(true);
    try {
      const endpoint = searchTerm
        ? `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(searchTerm)}&api_key=${GIPHY_KEY}&limit=20&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=20&rating=g`;

      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data || []);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGifs(val);
    }, 500);
  };

  const getGifUrl = (gif) => {
    return gif.images?.fixed_height_small?.url
      || gif.images?.downsized?.url
      || gif.images?.original?.url
      || '';
  };

  return (
    <div ref={pickerRef} className="gif-picker">
      <div className="gif-picker-header">
        <input
          type="text"
          placeholder="Search GIFs…"
          value={query}
          onChange={handleQueryChange}
          autoFocus
        />
      </div>
      <div className="gif-grid">
        {loading && (
          <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <div className="spinner" />
          </div>
        )}
        {!loading && gifs.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {GIPHY_KEY ? 'No GIFs found' : 'Set VITE_GIPHY_API_KEY in .env to enable GIFs'}
          </div>
        )}
        {gifs.map((gif) => {
          const url = getGifUrl(gif);
          if (!url) return null;
          return (
            <img
              key={gif.id}
              src={url}
              alt={gif.title || 'gif'}
              loading="lazy"
              onClick={() => onSelect(gif.images?.original?.url || url)}
            />
          );
        })}
      </div>
    </div>
  );
}
