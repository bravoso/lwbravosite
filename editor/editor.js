const refs = {
  owner: document.getElementById('owner'),
  repo: document.getElementById('repo'),
  branch: document.getElementById('branch'),
  token: document.getElementById('token'),
  workflow: document.getElementById('workflow'),
  fileSelect: document.getElementById('fileSelect'),
  editor: document.getElementById('editor'),
  preview: document.getElementById('preview'),
  status: document.getElementById('status'),
  currentFile: document.getElementById('currentFile'),
  dropzone: document.getElementById('dropzone'),
  mediaList: document.getElementById('mediaList'),
  mediaPath: document.getElementById('mediaPath')
};

let selectedFile = null;
let selectedSha = null;
let pendingMedia = [];

const snippets = [
  { label: 'Botão CTA', code: '<a href="#" class="btn">Quero entrar agora</a>' },
  { label: 'Imagem otimizada', code: '<img src="/assets/images/sua-imagem.webp" alt="Descrição" width="1200" height="630" loading="lazy" decoding="async">' },
  { label: 'Vídeo YouTube', code: '<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" title="YouTube video" loading="lazy" allowfullscreen></iframe>' },
  { label: 'Seção', code: '<section>\n  <div class="container">\n    <h2>Título</h2>\n    <p>Texto da seção.</p>\n  </div>\n</section>' }
];

function setStatus(msg, bad = false) {
  refs.status.textContent = msg;
  refs.status.style.color = bad ? '#fca5a5' : '#9fb0cd';
}

function saveSettings() {
  const data = {
    owner: refs.owner.value.trim(),
    repo: refs.repo.value.trim(),
    branch: refs.branch.value.trim(),
    token: refs.token.value.trim(),
    workflow: refs.workflow.value.trim()
  };
  localStorage.setItem('lw-editor-settings', JSON.stringify(data));
  setStatus('Configuração salva no navegador.');
}

function loadSettings() {
  const raw = localStorage.getItem('lw-editor-settings');
  if (!raw) return;
  const data = JSON.parse(raw);
  refs.owner.value = data.owner || '';
  refs.repo.value = data.repo || '';
  refs.branch.value = data.branch || 'work';
  refs.token.value = data.token || '';
  refs.workflow.value = data.workflow || 'pages.yml';
}

function ghHeaders() {
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${refs.token.value.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

async function gh(path, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: { ...ghHeaders(), ...(options.headers || {}) }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function refreshFiles() {
  setStatus('Carregando lista de arquivos...');
  refs.fileSelect.innerHTML = '';
  const owner = refs.owner.value.trim();
  const repo = refs.repo.value.trim();
  const branch = refs.branch.value.trim();
  const data = await gh(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  const files = data.tree
    .filter(item => item.type === 'blob')
    .map(item => item.path)
    .filter(path => /\.(html|css|js|md)$/i.test(path));

  for (const file of files) {
    const opt = document.createElement('option');
    opt.value = file;
    opt.textContent = file;
    refs.fileSelect.appendChild(opt);
  }
  setStatus(`${files.length} arquivos carregados.`);
}

function b64DecodeUtf8(base64) {
  return decodeURIComponent(escape(atob(base64.replace(/\n/g, ''))));
}

function b64EncodeUtf8(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

async function loadFile() {
  const path = refs.fileSelect.value;
  if (!path) return;
  selectedFile = path;
  setStatus(`Carregando ${path}...`);
  const owner = refs.owner.value.trim();
  const repo = refs.repo.value.trim();
  const branch = refs.branch.value.trim();
  const data = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`);
  selectedSha = data.sha;
  refs.editor.value = b64DecodeUtf8(data.content || '');
  refs.currentFile.textContent = path;
  updatePreview();
  setStatus(`${path} carregado.`);
}

async function saveFile() {
  if (!selectedFile) throw new Error('Carregue um arquivo antes de salvar.');
  setStatus(`Salvando ${selectedFile}...`);
  const owner = refs.owner.value.trim();
  const repo = refs.repo.value.trim();
  const branch = refs.branch.value.trim();
  const body = {
    message: `edit: ${selectedFile} via web editor`,
    content: b64EncodeUtf8(refs.editor.value),
    sha: selectedSha,
    branch
  };
  const data = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(selectedFile)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  selectedSha = data.content.sha;
  setStatus(`${selectedFile} salvo e commitado.`);
}

function insertAtCursor(text) {
  const input = refs.editor;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  input.selectionStart = input.selectionEnd = start + text.length;
  input.focus();
  updatePreview();
}

function renderSnippets() {
  const root = document.getElementById('snippetList');
  root.innerHTML = '';
  snippets.forEach(s => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'snippet-item';
    item.textContent = s.label;
    item.draggable = true;
    item.addEventListener('click', () => insertAtCursor(`\n${s.code}\n`));
    item.addEventListener('dragstart', ev => ev.dataTransfer.setData('text/plain', `\n${s.code}\n`));
    root.appendChild(item);
  });
}

function updatePreview() {
  refs.preview.srcdoc = refs.editor.value;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const result = fr.result;
      resolve(result.split(',')[1]);
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function renderMediaList() {
  refs.mediaList.innerHTML = '';
  pendingMedia.forEach(file => {
    const li = document.createElement('li');
    li.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
    refs.mediaList.appendChild(li);
  });
}

async function uploadMedia() {
  if (!pendingMedia.length) throw new Error('Nenhuma mídia selecionada.');
  const owner = refs.owner.value.trim();
  const repo = refs.repo.value.trim();
  const branch = refs.branch.value.trim();
  const basePath = refs.mediaPath.value.trim().replace(/^\/+|\/+$/g, '');

  for (const file of pendingMedia) {
    const path = `${basePath}/${file.name}`;
    const content = await fileToBase64(file);
    await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `media: upload ${file.name} via web editor`,
        content,
        branch
      })
    });
    insertAtCursor(`\n<img src="/${path}" alt="${file.name}" loading="lazy">\n`);
  }

  setStatus(`${pendingMedia.length} arquivo(s) enviados para ${basePath}.`);
  pendingMedia = [];
  renderMediaList();
}

async function deployNow() {
  const owner = refs.owner.value.trim();
  const repo = refs.repo.value.trim();
  const branch = refs.branch.value.trim();
  const workflow = refs.workflow.value.trim();
  await gh(`/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref: branch })
  });
  setStatus('Deploy disparado com workflow_dispatch.');
}

function bind() {
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  document.getElementById('refreshFilesBtn').addEventListener('click', () => safe(refreshFiles));
  document.getElementById('loadFileBtn').addEventListener('click', () => safe(loadFile));
  document.getElementById('saveFileBtn').addEventListener('click', () => safe(saveFile));
  document.getElementById('uploadMediaBtn').addEventListener('click', () => safe(uploadMedia));
  document.getElementById('deployBtn').addEventListener('click', () => safe(deployNow));
  refs.editor.addEventListener('input', updatePreview);

  refs.editor.addEventListener('dragover', ev => ev.preventDefault());
  refs.editor.addEventListener('drop', ev => {
    ev.preventDefault();
    const snippet = ev.dataTransfer.getData('text/plain');
    if (snippet) insertAtCursor(snippet);
  });

  refs.dropzone.addEventListener('dragover', ev => {
    ev.preventDefault();
    refs.dropzone.classList.add('drag');
  });
  refs.dropzone.addEventListener('dragleave', () => refs.dropzone.classList.remove('drag'));
  refs.dropzone.addEventListener('drop', ev => {
    ev.preventDefault();
    refs.dropzone.classList.remove('drag');
    pendingMedia = [...pendingMedia, ...Array.from(ev.dataTransfer.files || [])];
    renderMediaList();
    setStatus(`${pendingMedia.length} mídia(s) pronta(s) para upload.`);
  });
}

async function safe(fn) {
  try {
    await fn();
  } catch (err) {
    console.error(err);
    setStatus(err.message, true);
  }
}

loadSettings();
renderSnippets();
bind();
