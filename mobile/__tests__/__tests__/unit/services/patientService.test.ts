import { patientService } from '../../../src/services/patientService';

describe('patientService (mock auth)', () => {
  beforeEach(() => {
    patientService.logout();
  });

  describe('login', () => {
    it('berhasil dengan akun demo', async () => {
      const patient = await patientService.login({
        email: 'maya.johnson@email.com',
        password: 'bloom1234',
      });
      expect(patient.email).toBe('maya.johnson@email.com');
      expect(patientService.getCurrentPatient()).not.toBeNull();
    });

    it('email tidak peka huruf besar/kecil dan spasi', async () => {
      const patient = await patientService.login({
        email: '  Maya.Johnson@Email.com ',
        password: 'bloom1234',
      });
      expect(patient.email).toBe('maya.johnson@email.com');
    });

    it('menolak kata sandi salah dengan pesan generik', async () => {
      await expect(
        patientService.login({ email: 'maya.johnson@email.com', password: 'salah-salah' })
      ).rejects.toThrow('Email atau kata sandi salah.');
    });

    it('menolak email tidak terdaftar dengan pesan yang sama', async () => {
      await expect(
        patientService.login({ email: 'tidak.ada@email.com', password: 'bloom1234' })
      ).rejects.toThrow('Email atau kata sandi salah.');
    });

    it('menolak email/kata sandi kosong', async () => {
      await expect(patientService.login({ email: '', password: 'x' })).rejects.toThrow(/Email belum diisi/);
      await expect(
        patientService.login({ email: 'a@b.co', password: '' })
      ).rejects.toThrow(/Kata sandi belum diisi/);
    });
  });

  describe('register', () => {
    it('membuat akun baru, otomatis masuk, lalu bisa login ulang', async () => {
      const patient = await patientService.register({
        medicalRecordNumber: 'rm-30001',
        motherName: 'Siti Aminah',
        email: 'Siti@Email.com',
        password: 'rahasia123',
      });
      expect(patient.patientId).toBe('RM-30001');
      expect(patient.name).toBe('Siti Aminah');
      expect(patient.email).toBe('siti@email.com');
      expect(patient.avatarInitials).toBe('SA');
      expect(patientService.getCurrentPatient()?.id).toBe(patient.id);

      patientService.logout();
      const again = await patientService.login({ email: 'siti@email.com', password: 'rahasia123' });
      expect(again.id).toBe(patient.id);
    });

    it('menolak email yang sudah terdaftar', async () => {
      await expect(
        patientService.register({
          medicalRecordNumber: 'RM-30002',
          motherName: 'Dewi Lestari',
          email: 'maya.johnson@email.com',
          password: 'rahasia123',
        })
      ).rejects.toThrow(/Email sudah terdaftar/);
    });

    it('menolak No. RM yang sudah terdaftar', async () => {
      await expect(
        patientService.register({
          medicalRecordNumber: 'bl-20418',
          motherName: 'Dewi Lestari',
          email: 'dewi@email.com',
          password: 'rahasia123',
        })
      ).rejects.toThrow(/No\. Rekam Medis sudah terdaftar/);
    });

    it('menolak kata sandi kurang dari 8 karakter', async () => {
      await expect(
        patientService.register({
          medicalRecordNumber: 'RM-30003',
          motherName: 'Rina Wati',
          email: 'rina@email.com',
          password: 'pendek',
        })
      ).rejects.toThrow(/minimal 8 karakter/);
    });
  });

  describe('logout', () => {
    it('menghapus sesi pasien', async () => {
      await patientService.login({ email: 'maya.johnson@email.com', password: 'bloom1234' });
      patientService.logout();
      expect(patientService.getCurrentPatient()).toBeNull();
    });
  });

  describe('getUltrasoundRecords', () => {
    it('mengembalikan daftar rekaman', async () => {
      const records = await patientService.getUltrasoundRecords();
      expect(records.length).toBeGreaterThan(0);
      expect(records[0]).toHaveProperty('hasVideo');
    });
  });
});