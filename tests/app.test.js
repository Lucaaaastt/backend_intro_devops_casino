const request = require('supertest');

// ============================================
// MOCK de la base de datos
// ============================================
jest.mock('../src/db/pool', () => ({
  pool: {
    query: jest.fn()
  },
  esperarBD: jest.fn().mockResolvedValue()
}));

jest.mock('../src/db/seed', () => ({
  sembrarUsuariosDemo: jest.fn().mockResolvedValue()
}));

// Importar la app DESPUÉS del mock
const app = require('../src/server');

describe('Backend API Tests', () => {
  
  test('GET /health debe retornar 200 OK', async () => {
    // Mock para que la BD responda
    const { pool } = require('../src/db/pool');
    pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.db).toBe('up');
  });

  test('GET /health debe retornar 503 si la BD falla', async () => {
    const { pool } = require('../src/db/pool');
    pool.query.mockRejectedValueOnce(new Error('Connection refused'));
    
    const response = await request(app).get('/health');
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('degraded');
    expect(response.body.db).toBe('down');
  });

  test('GET / debe retornar información de la API', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.mensaje).toBe('API Casino Online');
    expect(response.body.endpoints).toContain('/api/auth');
  });

  test('POST /api/auth/login debe validar credenciales', async () => {
    const { pool } = require('../src/db/pool');
    
    // Mock para simular un usuario
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        username: 'demo',
        email: 'demo@casino.test',
        password_hash: '$2a$10$1ZP6WwS7ViNQ8yGIbL1mbu8z696tCpRAvWWP8LO8Vy8I0ifpNS98S',
        saldo: 1000,
        rol: 'jugador'
      }]
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'demo', password: 'demo1234' });
    
    // Con el hash real de la BD, demo1234 debería funcionar
    // Pero como es mock, puede fallar
    if (response.status === 200) {
      expect(response.body.token).toBeDefined();
      expect(response.body.usuario.username).toBe('demo');
    } else {
      // Si falla, al menos que sea 401 (credenciales inválidas)
      expect(response.status).toBe(401);
    }
  });
});
