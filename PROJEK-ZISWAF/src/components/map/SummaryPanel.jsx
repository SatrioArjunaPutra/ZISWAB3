import React from 'react';

export default function SummaryPanel() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '15px 30px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        gap: '30px',
        fontFamily: 'sans-serif',
        alignItems: 'center',
        border: '1px solid rgba(0,0,0,0.05)'
      }}
    >
      <div>
        <div style={{ fontSize: '11px', color: '#777', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zakat (Maal + Fitrah)</div>
        <div style={{ fontSize: '20px', color: '#1976D2', fontWeight: '800', marginTop: '4px' }}>Rp 328,62 M</div>
      </div>
      <div style={{ width: '1px', height: '35px', background: '#e0e0e0' }}></div>
      <div>
        <div style={{ fontSize: '11px', color: '#777', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Infak / Sedekah</div>
        <div style={{ fontSize: '20px', color: '#388E3C', fontWeight: '800', marginTop: '4px' }}>Rp 105,81 M</div>
      </div>
      <div style={{ width: '1px', height: '35px', background: '#e0e0e0' }}></div>
      <div>
        <div style={{ fontSize: '11px', color: '#777', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Pengumpulan</div>
        <div style={{ fontSize: '20px', color: '#F57C00', fontWeight: '800', marginTop: '4px' }}>Rp 3,84 T</div>
        <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>(Termasuk BAZNAS Provinsi)</div>
      </div>
    </div>
  );
}
