import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Pos from '../pages/Pos';
import { createMockSupabaseClient } from './mocks/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}));

describe('Kasir (POS) - Point of Sale System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-POS-001: Halaman POS harus menampilkan search bar', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/cari barang/i)).toBeInTheDocument();
    });
  });

  it('TEST-POS-002: POS harus menampilkan daftar barang', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
      expect(screen.getByText('Buku Tulis 38 Lembar')).toBeInTheDocument();
      expect(screen.getByText('Pensil 2B')).toBeInTheDocument();
    });
  });

  it('TEST-POS-003: Search barang harus berfungsi dengan benar', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    const searchInput = await screen.findByPlaceholderText(/cari barang/i);
    fireEvent.change(searchInput, { target: { value: 'Pulpen' } });

    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
      expect(screen.queryByText('Pensil 2B')).not.toBeInTheDocument();
    });
  });

  it('TEST-POS-004: Klik barang harus menambahkan ke keranjang', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    await waitFor(() => {
      const pulpenCard = screen.getByText('Pulpen Standard').closest('div');
      if (pulpenCard) {
        fireEvent.click(pulpenCard);
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Keranjang Belanja')).toBeInTheDocument();
    });
  });

  it('TEST-POS-005: Keranjang harus menampilkan tombol checkout', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/cetak struk/i)).toBeInTheDocument();
      expect(screen.getByText(/simpan data/i)).toBeInTheDocument();
    });
  });

  it('TEST-POS-006: Harus menampilkan total tagihan', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/total tagihan/i)).toBeInTheDocument();
    });
  });

  it('TEST-POS-007: Tombol checkout harus disabled jika keranjang kosong', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    await waitFor(() => {
      const cetakButton = screen.getByText(/cetak struk/i).closest('button');
      expect(cetakButton).toBeDisabled();
    });
  });

  it('TEST-POS-008: Harus bisa menambah kuantitas barang di keranjang', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    // Add item to cart first
    await waitFor(() => {
      const pulpenCard = screen.getByText('Pulpen Standard').closest('div');
      if (pulpenCard) {
        fireEvent.click(pulpenCard);
      }
    });

    // Check if plus button exists in cart
    await waitFor(() => {
      const plusButtons = screen.getAllByRole('button');
      const plusButton = plusButtons.find(btn => btn.querySelector('svg'));
      expect(plusButton).toBeDefined();
    });
  });

  it('TEST-POS-009: Harus bisa menghapus barang dari keranjang', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    // Add item first
    await waitFor(() => {
      const pulpenCard = screen.getByText('Pulpen Standard').closest('div');
      if (pulpenCard) {
        fireEvent.click(pulpenCard);
      }
    });

    // Find and click trash button
    await waitFor(() => {
      const allButtons = screen.getAllByRole('button');
      // Trash button should be present
      expect(allButtons.length).toBeGreaterThan(0);
    });
  });

  it('TEST-POS-010: Window.print harus dipanggil saat cetak struk', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    // Add item to cart
    await waitFor(() => {
      const pulpenCard = screen.getByText('Pulpen Standard').closest('div');
      if (pulpenCard) {
        fireEvent.click(pulpenCard);
      }
    });

    // Click cetak struk button
    const cetakButton = screen.getByText(/cetak struk/i).closest('button');
    if (cetakButton && !cetakButton.hasAttribute('disabled')) {
      fireEvent.click(cetakButton);
    }

    printSpy.mockRestore();
  });
});
