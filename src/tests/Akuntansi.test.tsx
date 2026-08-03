import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Akuntansi from '../pages/Akuntansi';

vi.mock('../lib/supabase', async () => {
  const { createMockSupabaseClient } = await import('./mocks/supabase');
  return {
    supabase: createMockSupabaseClient(),
  };
});

describe('Akuntansi - Modul Akuntansi Enterprise', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-AKUN-001: Harus menampilkan tab Laba Rugi', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Laba Rugi')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-002: Harus menampilkan tab Neraca', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Neraca')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-003: Harus menampilkan tab LPE (Laporan Perubahan Ekuitas)', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('LPE')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-004: Harus menampilkan tab LAK (Laporan Arus Kas)', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('LAK')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-005: Harus menampilkan tab Jurnal', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jurnal')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-006: Harus menampilkan tab Buku Besar', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Buku Besar')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-007: Harus menampilkan tab Neraca Saldo', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Neraca Saldo')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-008: Harus menampilkan tombol Pemasukan', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pemasukan')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-009: Harus menampilkan tombol Pengeluaran', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pengeluaran')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-010: Tab Laba Rugi harus tampilkan judul Laporan Laba Rugi', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Laporan Laba Rugi')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-011: Laporan Laba Rugi harus tampilkan Total Pendapatan', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/total pendapatan/i)).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-012: Laporan Laba Rugi harus tampilkan HPP', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('HPP')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-013: Laporan Laba Rugi harus tampilkan Laba Kotor', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Laba Kotor')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-014: Laporan Laba Rugi harus tampilkan Total Beban Operasional', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/total beban operasional/i)).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-015: Laporan Laba Rugi harus tampilkan LABA BERSIH', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('LABA BERSIH')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-016: Klik tab Neraca harus tampilkan Laporan Neraca', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    const neracaTab = await screen.findByText('Neraca');
    fireEvent.click(neracaTab);

    await waitFor(() => {
      expect(screen.getByText(/neraca \(posisi keuangan\)/i)).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-017: Neraca harus tampilkan AKTIVA (ASET)', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    const neracaTab = await screen.findByText('Neraca');
    fireEvent.click(neracaTab);

    await waitFor(() => {
      expect(screen.getByText(/aktiva \(aset\)/i)).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-018: Neraca harus tampilkan PASIVA (KEWAJIBAN & EKUITAS)', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    const neracaTab = await screen.findByText('Neraca');
    fireEvent.click(neracaTab);

    await waitFor(() => {
      expect(screen.getByText(/pasiva \(kewajiban & ekuitas\)/i)).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-019: Klik tab Jurnal harus tampilkan tabel jurnal', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    const jurnalTab = await screen.findByText('Jurnal');
    fireEvent.click(jurnalTab);

    await waitFor(() => {
      expect(screen.getByText('Waktu')).toBeInTheDocument();
      expect(screen.getByText('Deskripsi')).toBeInTheDocument();
      expect(screen.getByText('Akun')).toBeInTheDocument();
      expect(screen.getByText('Debit')).toBeInTheDocument();
      expect(screen.getByText('Kredit')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-020: Klik tab Buku Besar harus tampilkan dropdown pilih akun', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    const bukuBesarTab = await screen.findByText('Buku Besar');
    fireEvent.click(bukuBesarTab);

    await waitFor(() => {
      expect(screen.getByText(/-- pilih akun --/i)).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-021: Klik tab Neraca Saldo harus tampilkan tabel neraca saldo', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    const neracaSaldoTab = await screen.findByText('Neraca Saldo');
    fireEvent.click(neracaSaldoTab);

    await waitFor(() => {
      expect(screen.getByText('Kode')).toBeInTheDocument();
      expect(screen.getByText('Nama Akun')).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-022: Klik tab LPE harus tampilkan Laporan Perubahan Ekuitas', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    const lpeTab = await screen.findByText('LPE');
    fireEvent.click(lpeTab);

    await waitFor(() => {
      expect(screen.getByText(/laporan perubahan ekuitas/i)).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-023: Klik tab LAK harus tampilkan Laporan Arus Kas', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    const lakTab = await screen.findByText('LAK');
    fireEvent.click(lakTab);

    await waitFor(() => {
      expect(screen.getByText(/laporan arus kas/i)).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-024: Klik tombol Pemasukan harus buka modal form', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    const pemasukanButton = await screen.findByText('Pemasukan');
    fireEvent.click(pemasukanButton);

    await waitFor(() => {
      expect(screen.getByText(/setor pemasukan/i)).toBeInTheDocument();
    });
  });

  it('TEST-AKUN-025: Klik tombol Pengeluaran harus buka modal form', async () => {
    render(
      <BrowserRouter>
        <Akuntansi />
      </BrowserRouter>
    );

    const pengeluaranButton = await screen.findByText('Pengeluaran');
    fireEvent.click(pengeluaranButton);

    await waitFor(() => {
      expect(screen.getByText(/catat pengeluaran/i)).toBeInTheDocument();
    });
  });
});
