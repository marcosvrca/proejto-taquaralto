const request = require('supertest');
const bcrypt = require('bcryptjs');

const appModule = require('../index');
const userEntity = require('../entities/User');

const createApp = appModule.createApp;
const AppDataSource = appModule.AppDataSource;
const User = userEntity.User;

describe('Auth, permissões e integridade', () => {
  let app;
  let adminToken;
  let userToken;
  let userId;
  const stamp = Date.now();

  beforeAll(async () => {
    app = createApp();
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    app.locals.dataSource = AppDataSource;

    const userRepo = AppDataSource.getRepository(User);
    let admin = await userRepo.findOne({ where: { email: 'admin@taquaralto.com' } });
    if (!admin) {
      admin = userRepo.create({
        email: 'admin@taquaralto.com',
        password: await bcrypt.hash('@2026taquaraltofutsal', 10),
        name: 'Admin',
        isAdmin: true,
      });
      await userRepo.save(admin);
    }

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@taquaralto.com', password: '@2026taquaraltofutsal' });

    expect(login.status).toBe(200);
    adminToken = login.body.token;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('não permite criar admin via register público', async () => {
    const email = `noadmin_${stamp}@test.com`;
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'test123', name: 'Evil', isAdmin: true });

    expect(reg.status).toBe(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'test123' });

    expect(login.status).toBe(200);
    expect(login.body.user.isAdmin).toBe(false);
  });

  it('cria usuário com permissões e bloqueia módulo sem acesso', async () => {
    const email = `perm_${stamp}@test.com`;
    const create = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email,
        password: 'test123',
        name: 'Perm User',
        canAccessSleep: false,
        canAccessWorkouts: true,
        canAccessNutrition: true,
        canAccessHealth: false,
        canAccessGoals: true,
      });

    expect(create.status).toBe(201);
    userId = create.body.user.id;

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'test123' });

    expect(login.status).toBe(200);
    userToken = login.body.token;
    expect(login.body.user.canAccessSleep).toBe(false);

    const sleepDenied = await request(app)
      .post('/api/sleep/bed')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-09-01', bedTime: '22:00', wakeTime: '06:00' });

    expect(sleepDenied.status).toBe(403);
  });

  it('retorna /me com permissões atuais', async () => {
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(me.status).toBe(200);
    expect(me.body.canAccessSleep).toBe(false);
    expect(me.body.canAccessWorkouts).toBe(true);
  });

  it('aplica revogação de permissão imediatamente', async () => {
    const revoke = await request(app)
      .put(`/api/admin/users/${userId}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ canAccessWorkouts: false });

    expect(revoke.status).toBe(200);

    const workouts = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${userToken}`);

    expect(workouts.status).toBe(403);
  });

  it('bloqueia admin routes para usuário comum', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('rejeita token inválido', async () => {
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', 'Bearer invalid.token');

    expect(res.status).toBe(401);
  });

  it('renova access token via refresh', async () => {
    const email = `refresh_${stamp}@test.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'test123', name: 'Refresh' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'test123' });

    expect(login.status).toBe(200);
    expect(login.body.refreshToken).toBeTruthy();

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.token).toBeTruthy();
    expect(refreshed.body.refreshToken).toBeTruthy();

    // refresh token não pode acessar rotas protegidas
    const misuse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.refreshToken}`);

    expect(misuse.status).toBe(401);
  });

  it('impede duplicata de sono na mesma data', async () => {
    await request(app)
      .put(`/api/admin/users/${userId}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ canAccessSleep: true });

    const payload = { date: '2026-08-20', bedTime: '23:00', wakeTime: '07:00' };

    const first = await request(app)
      .post('/api/sleep/bed')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect([200, 201]).toContain(first.status);

    const second = await request(app)
      .post('/api/sleep/bed')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(second.status).toBe(409);
  });

  it('deleta usuário e registros relacionados em cascade/transação', async () => {
    await request(app)
      .put(`/api/admin/users/${userId}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ canAccessWorkouts: true });

    await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: '2026-09-02',
        time: '08:00',
        type: 'Corrida',
        intensity: 'Média',
        durationMinutes: 20,
      });

    const del = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(del.status).toBe(200);

    const userRepo = AppDataSource.getRepository(User);
    const gone = await userRepo.findOne({ where: { id: userId } });
    expect(gone).toBeNull();
  });
});
export {};
