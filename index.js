import express from 'express';
import cors from 'cors';
import RPC from 'discord-rpc';
import psList from 'ps-list';

const app = express();
const PORT = process.env.PORT || 3000;

// Habilita CORS
app.use(cors());


// Rota única para verificar se o VSCode está aberto
app.get('/', async (req, res) => {
  const processes = await psList();
  const isVSCodeRunning = processes.some(p => p.name.includes('Code')); // Nome do processo do VSCode geralmente inclui 'Code'

  if (isVSCodeRunning) {
    console.log('VSCode está aberto!');
    return res.json({ status: 1 }); // Retorna 1 se o VSCode estiver aberto
  } else {
    console.log('VSCode não está rodando.');
    return res.json({ status: 0 }); // Retorna 0 se o VSCode não estiver aberto
  }
});

app.listen(PORT)

// Configuração do Discord RPC
const clientId = '1292962395152453695';
RPC.register(clientId);
const rpc = new RPC.Client({ transport: 'ipc' });

rpc.on('ready', () => {
  console.log('Conectado ao Discord.');
  checkVSCode(); // Verifica uma vez ao conectar

  // Verifica a cada 10 segundos se o VSCode está rodando
  setInterval(checkVSCode, 10 * 1000);
});

async function checkVSCode() {
  const processes = await psList();
  const isVSCodeRunning = processes.some(p => p.name.includes('Code'));

  if (isVSCodeRunning) {
    console.log('VSCode está aberto! Atualizando Rich Presence...');
    setActivity('Editando código no VSCode');
  } else {
    console.log('VSCode não está rodando.');
    setActivity('Fazendo outra coisa');
  }
}

function setActivity(details) {
  rpc.setActivity({
    details: details,
    state: 'Trabalhando...',
    startTimestamp: Date.now(),
    largeImageKey: 'vscode',
    largeImageText: 'Visual Studio Code',
    instance: false
  });
}

rpc.login({ clientId }).catch(console.error);
