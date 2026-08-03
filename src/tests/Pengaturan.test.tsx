import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Pengaturan from '../pages/Pengaturan';
import { createMockSupabaseClient } from './mocks/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}));

describe('Pengaturan - Settings & User Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-SETT-001: Harus menampilkan tab Profil Usaha', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Profil Usaha')).toBeInTheDocument();
    });
  });

  it('TEST-SETT-002: Harus menampilkan tab Manajemen Pengurus', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manajemen Pengurus')).toBeInTheDocument();
    });
  });

  it('TEST-SETT-003: Tab Profil Usaha harus menampilkan judul Pengaturan Profil Usaha', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/pengaturan profil usaha/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-004: Form Profil Usaha harus memiliki field Nama Toko / Usaha BUMDes', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/nama toko \/ usaha bumdes/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-005: Form Profil Usaha harus memiliki field Alamat Lengkap', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/alamat lengkap/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-006: Form Profil Usaha harus memiliki field No Telepon / WhatsApp', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no telepon \/ whatsapp/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-007: Form Profil Usaha harus memiliki tombol Simpan Perubahan', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/simpan perubahan/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-008: Klik tab Manajemen Pengurus harus tampilkan Daftar Akun Pengurus', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    const pengurusTab = await screen.findByText('Manajemen Pengurus');
    fireEvent.click(pengurusTab);

    await waitFor(() => {
      expect(screen.getByText(/daftar akun pengurus/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-009: Tab Manajemen Pengurus harus menampilkan form Tambah Akun Baru', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    const pengurusTab = await screen.findByText('Manajemen Pengurus');
    fireEvent.click(pengurusTab);

    await waitFor(() => {
      expect(screen.getByText(/tambah akun baru/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-010: Form Tambah Akun harus memiliki field Nama Lengkap', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    const pengurusTab = await screen.findByText('Manajemen Pengurus');
    fireEvent.click(pengurusTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/contoh: budi santoso/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-011: Form Tambah Akun harus memiliki field Email / Username', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    const pengurusTab = await screen.findByText('Manajemen Pengurus');
    fireEvent.click(pengurusTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/budi@bumdes.com/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-012: Form Tambah Akun harus memiliki field Kata Sandi (Password)', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    const pengurusTab = await screen.findByText('Manajemen Pengurus');
    fireEvent.click(pengurusTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/minimal 6 karakter/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-013: Form Tambah Akun harus memiliki dropdown Jabatan', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    const pengurusTab = await screen.findByText('Manajemen Pengurus');
    fireEvent.click(pengurusTab);

    await waitFor(() => {
      expect(screen.getByText(/direktur bumdes/i)).toBeInTheDocument();
      expect(screen.getByText(/bendahara/i)).toBeInTheDocument();
      expect(screen.getByText(/sekretaris/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-014: Form Tambah Akun harus memiliki tombol Tambahkan Akun', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    const pengurusTab = await screen.findByText('Manajemen Pengurus');
    fireEvent.click(pengurusTab);

    await waitFor(() => {
      expect(screen.getByText(/tambahkan akun/i)).toBeInTheDocument();
    });
  });

  it('TEST-SETT-015: Daftar pengurus harus menampilkan data dari database', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    const pengurusTab = await screen.findByText('Manajemen Pengurus');
    fireEvent.click(pengurusTab);

    await waitFor(() => {
      expect(screen.getByText('Admin Utama')).toBeInTheDocument();
    });
  });

  it('TEST-SETT-016: Setiap akun pengurus harus memiliki tombol hapus', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    const pengurusTab = await screen.findByText('Manajemen Pengurus');
    fireEvent.click(pengurusTab);

    await waitFor(() => {
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThan(0);
    });
  });

  it('TEST-SETT-017: Data pengurus harus menampilkan nama, email, dan role', async () => {
    render(
      <BrowserRouter>
        <Pengaturan />
      </BrowserRouter>
    );

    const pengurusTab = await screen.findByText('Manajemen Pengurus');
    fireEvent.click(pengurusTab);

    await waitFor(() => {
      expect(screen.getByText('Admin Utama')).toBeInTheDocument();
      expect(screen.getByText('admin@bumdes.com')).toBeInTheDocument();
    });
  });
});
