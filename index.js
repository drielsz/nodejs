import express from 'express';
import cors from 'cors';
import RPC from 'discord-rpc';
import psList from 'ps-list';
import axios from 'axios'; // Para enviar status para a API na nuvem

const app = express();
const PORT = process.env.PORT || 3001;
const clientId = '1292962395152453695'; // Seu clientId do Discord
const cloudAPIEndpoint = 'https://nodejs-production-9013.up.railway.app/'; // URL da sua API na nuvem

// Habilita CORS
app.use(cors());
app.use(express.json()); // Para lidar com JSON

// Variável para armazenar o status do VSCode
let vscodeStatus = 0; // 0 significa fechado, 1 significa aberto

// Função para verificar se o VSCode está rodando
async function checkVSCode() {
  const processes = await psList();
  const isVSCodeRunning = processes.some(p => p.name.includes('Code'));

  if (isVSCodeRunning) {
    console.log('VSCode está aberto! Atualizando Rich Presence...');
    setActivity('Editando código no VSCode');
    vscodeStatus = 1; // Status 1 (aberto)
  } else {
    console.log('VSCode não está rodando.');
    setActivity('Fazendo outra coisa');
    vscodeStatus = 0; // Status 0 (fechado)
  }

  // Envia o status para a API na nuvem
  await sendStatusToCloud(vscodeStatus);
}

// Função para atualizar o status no Discord Rich Presence
function setActivity(details) {
  rpc.setActivity({
    details: details,
    state: 'Trabalhando...',
    startTimestamp: Date.now(),
    largeImageKey: 'vscode',
    largeImageText: 'Visual Studio Code',
    instance: false,
  });
}

// Envia o status para a API na nuvem
async function sendStatusToCloud(status) {
  try {
    await axios.post(cloudAPIEndpoint, { status: status });
    console.log('Status enviado para a API na nuvem:', status);
  } catch (error) {
    console.error('Erro ao enviar status para a API na nuvem:', error);
  }
}

// Inicia a conexão com o Discord RPC
const rpc = new RPC.Client({ transport: 'ipc' });
rpc.on('ready', () => {
  console.log('Conectado ao Discord.');
  checkVSCode(); // Verifica uma vez ao conectar

  // Verifica a cada 10 segundos se o VSCode está rodando
  setInterval(checkVSCode, 10 * 1000);
});

rpc.login({ clientId }).catch(console.error);

// Servidor local para a API
app.post('/status', (req, res) => {
  const { status } = req.body;
  if (status !== undefined) {
    vscodeStatus = status;
    console.log(`Status do VSCode atualizado para: ${status === 1 ? 'Aberto' : 'Fechado'}`);
    res.status(200).json({ message: 'Status atualizado com sucesso' });
  } else {
    res.status(400).json({ message: 'Status inválido' });
  }
});

// Endpoint para checar o status do VSCode
app.get('/status', (req, res) => {
  res.json({ vscodeStatus });
});

// Inicia o servidor local
app.listen(PORT, () => {
  console.log(`Servidor local rodando na porta ${PORT}`);
});
