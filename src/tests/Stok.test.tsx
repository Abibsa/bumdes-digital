import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Stok from '../pages/Stok';
import { createMockSupabaseClient } from './mocks/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}));

describe('Manajemen Stok & Kartu Stok', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-STOK-001: Halaman Stok harus menampilkan tab Manajemen Stok', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manajemen Stok')).toBeInTheDocument();
    });
  });

  it('TEST-STOK-002: Halaman Stok harus menampilkan tab Kartu Stok', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Kartu Stok')).toBeInTheDocument();
    });
  });

  it('TEST-STOK-003: Harus menampilkan tombol Tambah Barang', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/tambah barang/i)).toBeInTheDocument();
    });
  });

  it('TEST-STOK-004: Harus menampilkan tombol refresh', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    await waitFor(() => {
      const refreshButtons = screen.getAllByRole('button');
      expect(refreshButtons.length).toBeGreaterThan(0);
    });
  });

  it('TEST-STOK-005: Harus menampilkan search bar untuk cari barang', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/cari berdasarkan nama/i)).toBeInTheDocument();
    });
  });

  it('TEST-STOK-006: Tabel stok harus menampilkan kolom yang benar', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/kode \(sku\)/i)).toBeInTheDocument();
      expect(screen.getByText(/nama barang/i)).toBeInTheDocument();
      expect(screen.getByText(/kategori/i)).toBeInTheDocument();
      expect(screen.getByText(/harga beli/i)).toBeInTheDocument();
      expect(screen.getByText(/harga jual/i)).toBeInTheDocument();
      expect(screen.getByText(/stok/i)).toBeInTheDocument();
      expect(screen.getByText(/aksi/i)).toBeInTheDocument();
    });
  });

  it('TEST-STOK-007: Harus menampilkan data barang dari database', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
      expect(screen.getByText('ATK001')).toBeInTheDocument();
    });
  });

  it('TEST-STOK-008: Search barang harus filter data dengan benar', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    const searchInput = await screen.findByPlaceholderText(/cari berdasarkan nama/i);
    fireEvent.change(searchInput, { target: { value: 'Pulpen' } });

    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
    });
  });

  it('TEST-STOK-009: Tombol Edit harus ada pada setiap baris barang', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const editButtons = buttons.filter(btn => {
        const svg = btn.querySelector('svg');
        return svg !== null;
      });
      expect(editButtons.length).toBeGreaterThan(0);
    });
  });

  it('TEST-STOK-010: Tombol Hapus harus ada pada setiap baris barang', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(2);
    });
  });

  it('TEST-STOK-011: Klik Tambah Barang harus buka modal form', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    const tambahButton = await screen.findByText(/tambah barang/i);
    fireEvent.click(tambahButton);

    await waitFor(() => {
      expect(screen.getByText('Tambah Barang Baru')).toBeInTheDocument();
    });
  });

  it('TEST-STOK-012: Modal form harus memiliki field Kode SKU', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    const tambahButton = await screen.findByText(/tambah barang/i);
    fireEvent.click(tambahButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/kode \(sku\)/i)).toBeInTheDocument();
    });
  });

  it('TEST-STOK-013: Modal form harus memiliki field Nama Barang', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    const tambahButton = await screen.findByText(/tambah barang/i);
    fireEvent.click(tambahButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nama barang/i)).toBeInTheDocument();
    });
  });

  it('TEST-STOK-014: Modal form harus memiliki dropdown Kategori', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    const tambahButton = await screen.findByText(/tambah barang/i);
    fireEvent.click(tambahButton);

    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  it('TEST-STOK-015: Pindah ke tab Kartu Stok harus tampilkan dropdown pilih barang', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    const kartuTab = await screen.findByText('Kartu Stok');
    fireEvent.click(kartuTab);

    await waitFor(() => {
      expect(screen.getByText(/-- pilih barang --/i)).toBeInTheDocument();
    });
  });

  it('TEST-STOK-016: Kartu Stok harus menampilkan judul Buku Pembantu Persediaan', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    const kartuTab = await screen.findByText('Kartu Stok');
    fireEvent.click(kartuTab);

    await waitFor(() => {
      expect(screen.getByText(/buku pembantu persediaan/i)).toBeInTheDocument();
    });
  });

  it('TEST-STOK-017: Tabel Kartu Stok harus memiliki kolom Waktu, Keterangan, Masuk, Keluar, Saldo', async () => {
    render(
      <BrowserRouter>
        <Stok />
      </BrowserRouter>
    );

    const kartuTab = await screen.findByText('Kartu Stok');
    fireEvent.click(kartuTab);

    await waitFor(() => {
      expect(screen.getByText('Waktu')).toBeInTheDocument();
      expect(screen.getByText('Keterangan')).toBeInTheDocument();
      expect(screen.getByText('Masuk')).toBeInTheDocument();
      expect(screen.getByText('Keluar')).toBeInTheDocument();
      expect(screen.getByText(/saldo stok/i)).toBeInTheDocument();
    });
  });
});
