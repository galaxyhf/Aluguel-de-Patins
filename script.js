// ================================
// Simulação de base de dados
// ================================
const patinsDisponiveis = [
  { id: 'P001', tamanho: 35, disponivel: true },
  { id: 'P002', tamanho: 36, disponivel: true },
  { id: 'P003', tamanho: 37, disponivel: true },
  { id: 'P004', tamanho: 38, disponivel: true },
  { id: 'P005', tamanho: 39, disponivel: true },
  { id: 'P006', tamanho: 40, disponivel: true },
  { id: 'P007', tamanho: 41, disponivel: true },
  { id: 'P008', tamanho: 42, disponivel: true },
  { id: 'P009', tamanho: 43, disponivel: true },
  { id: 'P010', tamanho: 44, disponivel: true },
];

const alugueis = [];
// { idPatins, tamanho, cpf, horaInicio, horaFim, total, formaPagamento, danificado, contabilizado }

// ================================
// Configurações
// ================================
const precoPorHora = 10; // R$/hora
const valorDano   = 20;  // acréscimo por dano

// ================================
// Estado do Relatório de Fechamento
// ================================
let relatorioPendentes   = [];
let relatorioTotais      = {};
let relatorioTotalGeral  = 0;

// ================================
// Utilidades
// ================================
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function formatDateTime(dt){
  return new Date(dt).toLocaleString('pt-BR');
}
function formatBRL(n){
  return (Number(n)||0).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2});
}

// Toast com fallback
function toast(msg, type='info'){
  let box = document.querySelector('#toast');
  if (!box) {
    alert(msg);
    box = document.createElement('div');
    box.id = 'toast';
    box.className = 'toast';
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.classList.add('show');
  setTimeout(()=> box.classList.remove('show'), 2200);

  if(type==='ok'){ box.style.borderColor = 'rgba(52,211,153,.4)'; }
  else if(type==='err'){ box.style.borderColor = 'rgba(248,113,113,.4)'; }
  else { box.style.borderColor = 'var(--border)'; }
}

// Validação de CPF
function cpfValido(cpf){
  cpf = (cpf||'').replace(/\D/g,'');
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma=0, resto;
  for(let i=1;i<=9;i++) soma += parseInt(cpf.substring(i-1,i))*(11-i);
  resto = (soma*10)%11;
  if(resto===10 || resto===11) resto=0;
  if(resto !== parseInt(cpf.substring(9,10))) return false;

  soma=0;
  for(let i=1;i<=10;i++) soma += parseInt(cpf.substring(i-1,i))*(12-i);
  resto = (soma*10)%11;
  if(resto===10 || resto===11) resto=0;
  return resto === parseInt(cpf.substring(10,11));
}

// Máscara de CPF (parcial/total)
function formatarCPF(valor) {
  valor = String(valor).replace(/\D/g, '');
  if (valor.length > 11) valor = valor.slice(0, 11);

  if (valor.length > 9) {
    return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
  } else if (valor.length > 6) {
    return valor.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
  } else if (valor.length > 3) {
    return valor.replace(/(\d{3})(\d{0,3})/, "$1.$2");
  } else {
    return valor;
  }
}

// Abre relatório em nova guia com botão "Baixar/Imprimir PDF"
function abrirRelatorioPDF(itens, totaisPorForma, totalGeral){
  const win = window.open('', '_blank');

  const estilo = `
    <style>
      :root{ --ink:#111827; --muted:#6b7280; --border:#e5e7eb; --accent:#6ee7ff; --accent2:#a78bfa; }
      *{box-sizing:border-box;font-family:Poppins,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif}
      body{margin:0;background:#fff;color:var(--ink)}
      header{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
      h1{margin:0;font-size:20px}
      .sub{color:var(--muted);font-size:13px;margin-top:4px}
      .btns{display:flex;gap:10px}
      button{border:0;padding:10px 14px;border-radius:10px;cursor:pointer;background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111827;font-weight:700}
      main{padding:20px 24px}
      .sec{margin-bottom:18px}
      table{width:100%;border-collapse:collapse;border:1px solid var(--border);border-radius:12px;overflow:hidden}
      th,td{padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;font-size:14px}
      thead th{background:#f3f4f6;color:#374151;font-weight:600}
      tfoot td{font-weight:700}
      .totais{margin-top:12px}
      .totais ul{margin:8px 0 0 18px;padding:0}
      .totais li{margin:2px 0}
      .right{text-align:right}
      @media print{button{display:none} header{border-bottom:none}}
    </style>
  `;

  const agora = new Date();
  const periodo = (() => {
    if (itens.length === 0) return '—';
    const inicios = itens.map(i=>+new Date(i.horaInicio));
    const fins    = itens.map(i=>+new Date(i.horaFim));
    const inicioMin = new Date(Math.min(...inicios));
    const fimMax    = new Date(Math.max(...fins));
    return `${formatDateTime(inicioMin)} — ${formatDateTime(fimMax)}`;
  })();

  const linhas = itens.map(a => `
    <tr>
      <td>${a.idPatins}</td>
      <td>${a.tamanho}</td>
      <td>${formatarCPF(a.cpf)}</td>
      <td>${formatDateTime(a.horaInicio)}</td>
      <td>${formatDateTime(a.horaFim)}</td>
      <td>${a.danificado ? 'Sim' : 'Não'}</td>
      <td>${(a.formaPagamento||'')}</td>
      <td class="right">R$ ${formatBRL(a.total)}</td>
    </tr>
  `).join('');

  const listaTotais = Object.keys(totaisPorForma).map(forma =>
    `<li><strong>${forma}:</strong> R$ ${formatBRL(totaisPorForma[forma])}</li>`
  ).join('') || '<li>—</li>';

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head><meta charset="utf-8" /><title>Relatório de Fechamento</title>${estilo}</head>
      <body>
        <header>
          <div>
            <h1>Relatório de Fechamento</h1>
            <div class="sub">Gerado em ${formatDateTime(agora)} | Período: ${periodo}</div>
          </div>
          <div class="btns">
            <button onclick="window.print()">Baixar/Imprimir PDF</button>
          </div>
        </header>
        <main>
          <section class="sec">
            <table>
              <thead>
                <tr>
                  <th>Par (ID)</th><th>Tam.</th><th>CPF</th><th>Início</th><th>Fim</th><th>Danificado</th><th>Pagamento</th><th class="right">Total (R$)</th>
                </tr>
              </thead>
              <tbody>${linhas || `<tr><td colspan="8">Nenhum lançamento neste fechamento.</td></tr>`}</tbody>
              <tfoot>
                <tr><td colspan="7" class="right">Total final</td><td class="right">R$ ${formatBRL(totalGeral)}</td></tr>
              </tfoot>
            </table>
          </section>
          <section class="sec totais">
            <strong>Totais por forma de pagamento</strong>
            <ul>${listaTotais}</ul>
          </section>
        </main>
      </body>
    </html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

// ================================
// Navegação entre seções
// ================================
const sections = {
  'alugar': $('#alugar-section'),
  'encerrar': $('#encerrar-section'),
  'fechar-caixa': $('#fechar-caixa-section'),
  'consultas': $('#consultas-section')
};
$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click',()=> showSection(btn.dataset.section));
});
function showSection(key){
  Object.values(sections).forEach(s=>s.classList.remove('active'));
  sections[key].classList.add('active');
  $$('.nav-btn').forEach(b=>b.classList.remove('active'));
  $(`.nav-btn[data-section="${key}"]`).classList.add('active');
}

// Tabs (Consultas)
const tabs = $$('.tab');
tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  $$('.tab-content').forEach(c=>c.classList.remove('active'));
  $(`#tab-${t.dataset.tab}`).classList.add('active');
}));

// ================================
// Alugar Patins
// ================================
const disponibilidadeMsg = $('#disponibilidade-msg');
const registroAluguelDiv = $('#registro-aluguel');
const formAlugar = $('#form-alugar');
const horaPrevia = $('#hora-previa');
const patinsIdDisplay = $('#patins-id');

function updateHoraPrevia(){ horaPrevia.textContent = formatDateTime(new Date()); }
setInterval(updateHoraPrevia, 1000); updateHoraPrevia();

// Máscara no input de CPF (novo aluguel)
$('#cpf')?.addEventListener('input', (e) => {
  e.target.value = formatarCPF(e.target.value).slice(0,14);
});

// Verificar disponibilidade (tamanho 35–44)
$('#verificar-disponibilidade').addEventListener('click', () => {
  const tamanhoSel = parseInt($('#tamanho').value, 10);
  disponibilidadeMsg.textContent = '';
  registroAluguelDiv.classList.add('hidden');

  if (isNaN(tamanhoSel) || tamanhoSel < 35 || tamanhoSel > 44){
    disponibilidadeMsg.textContent = 'Não temos patins desse tamanho.';
    disponibilidadeMsg.classList.remove('ok');
    disponibilidadeMsg.classList.add('msg-erro'); // certifique-se de ter .msg-erro { color: var(--err); }
    return;
  }

  const patins = patinsDisponiveis.find(p => p.tamanho === tamanhoSel && p.disponivel);
  if (patins){
    disponibilidadeMsg.textContent = `Disponível! Par ${patins.id} para o número ${tamanhoSel}.`;
    disponibilidadeMsg.classList.remove('msg-erro');
    disponibilidadeMsg.classList.add('ok');
    registroAluguelDiv.dataset.patinsId = patins.id;
    patinsIdDisplay.textContent = patins.id;
    registroAluguelDiv.classList.remove('hidden');
  } else {
    disponibilidadeMsg.textContent = 'Não há patins disponíveis para esse tamanho.';
    disponibilidadeMsg.classList.remove('ok');
    disponibilidadeMsg.classList.add('msg-erro');
  }
});

// Registrar aluguel
formAlugar.addEventListener('submit', (e) => {
  e.preventDefault();
  const cpfInput = $('#cpf').value.trim();
  const cpf = cpfInput.replace(/\D/g,'');
  const patinsId = registroAluguelDiv.dataset.patinsId;
  const tamanhoSel = parseInt($('#tamanho').value, 10);

  if(!cpfValido(cpf)){ toast('CPF inválido.', 'err'); return; }
  if(!patinsId){ toast('Verifique a disponibilidade antes.', 'err'); return; }

  const horaInicio = new Date();
  alugueis.push({
    idPatins: patinsId,
    tamanho: tamanhoSel,
    cpf: cpf,
    horaInicio: horaInicio,
    horaFim: null,
    total: null,
    formaPagamento: null,
    danificado: false,
    contabilizado: false
  });

  const patins = patinsDisponiveis.find(p => p.id === patinsId);
  if (patins) patins.disponivel = false;

  toast(`Aluguel registrado! Par ${patinsId}.`, 'ok');
  formAlugar.reset();
  disponibilidadeMsg.textContent='';
  disponibilidadeMsg.classList.remove('ok','msg-erro');
  registroAluguelDiv.classList.add('hidden');
  renderConsultas();
});

// ================================
// Encerrar Aluguel
// ================================
const btnBuscarAluguel = $('#buscar-aluguel');
const dadosAluguelDiv = $('#dados-aluguel');
const horaInicioSpan = $('#hora-inicio');
const cpfClienteSpan = $('#cpf-cliente');
const horaFimSpan = $('#hora-fim');
const totalPagarSpan = $('#total-pagar');
const patinsDanificadoCheckbox = $('#patins-danificado');
const formaPagamentoSelect = $('#forma-pagamento');
const erroEncerrarDiv = $('#erro-encerrar');
const horaFimPrevia = $('#hora-fim-previa');
const formEncerrar = $('#form-encerrar');

// NOVO: campo de “Tipo de cartão”
const tipoCartaoField  = document.querySelector('#tipo-cartao-field');
const tipoCartaoSelect = document.querySelector('#tipo-cartao');

setInterval(() => { horaFimPrevia.textContent = formatDateTime(new Date()); }, 1000);
let aluguelAtual = null;

// Mostrar/ocultar “Tipo de cartão” conforme forma de pagamento
formaPagamentoSelect.addEventListener('change', () => {
  if ((formaPagamentoSelect.value || '').toLowerCase() === 'cartao') {
    tipoCartaoField?.classList.remove('hidden');
  } else {
    tipoCartaoField?.classList.add('hidden');
    if (tipoCartaoSelect) tipoCartaoSelect.value = '';
  }
});

// Máscara de CPF em tempo real no campo de busca (só números)
const inputBusca = document.querySelector('#id-patins');
inputBusca.addEventListener('input', (e) => {
  const val = e.target.value;
  if (/[a-zA-Z]/.test(val)) return;             // provável ID
  const digits = val.replace(/\D/g, '').slice(0, 11);
  e.target.value = formatarCPF(digits);
});

// Enter também dispara buscar
inputBusca.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); btnBuscarAluguel.click(); }
});

// Buscar por ID ou CPF
btnBuscarAluguel.addEventListener('click', () => {
  let entrada = $('#id-patins').value.trim();
  erroEncerrarDiv.textContent = '';
  dadosAluguelDiv.classList.add('hidden');
  aluguelAtual = null;

  // reset tipo de cartão
  tipoCartaoField?.classList.add('hidden');
  if (tipoCartaoSelect) tipoCartaoSelect.value = '';

  if (!entrada){
    erroEncerrarDiv.textContent = 'Informe o ID do par ou CPF.';
    return;
  }

  const cpfBusca = entrada.replace(/\D/g, '');
  if (cpfBusca.length === 11) {
    const abertosDoCpf = alugueis
      .filter(a => a.cpf === cpfBusca && a.horaFim === null)
      .sort((a, b) => b.horaInicio - a.horaInicio);
    aluguelAtual = abertosDoCpf[0] || null;
  } else {
    const idNorm = entrada.toLowerCase();
    aluguelAtual = alugueis.find(a =>
      a.horaFim === null && String(a.idPatins).toLowerCase() === idNorm
    ) || null;
  }

  if(!aluguelAtual){
    erroEncerrarDiv.textContent = 'Nenhum aluguel em aberto para este identificador.';
    return;
  }

  // Preenche dados
  horaInicioSpan.textContent = formatDateTime(aluguelAtual.horaInicio);
  cpfClienteSpan.textContent = formatarCPF(aluguelAtual.cpf);
  const horaFim = new Date();
  horaFimSpan.textContent = formatDateTime(horaFim);

  const diffMs = horaFim - aluguelAtual.horaInicio;
  const diffHoras = Math.ceil(diffMs / (1000*60*60));
  let total = diffHoras * precoPorHora;
  totalPagarSpan.textContent = total.toFixed(2);

  dadosAluguelDiv.classList.remove('hidden');
  formaPagamentoSelect.value = '';
  patinsDanificadoCheckbox.checked = false;
});

// Recalcula total ao marcar/desmarcar dano
patinsDanificadoCheckbox.addEventListener('change', () => {
  if (!aluguelAtual) return;
  const horaFim = new Date();
  const diffMs = horaFim - aluguelAtual.horaInicio;
  const diffHoras = Math.ceil(diffMs / (1000*60*60));
  let total = diffHoras * precoPorHora + (patinsDanificadoCheckbox.checked ? valorDano : 0);
  totalPagarSpan.textContent = total.toFixed(2);
});

// Confirmar encerramento
formEncerrar.addEventListener('submit', (e) => {
  e.preventDefault();

  if(!aluguelAtual){
    toast('Busque um aluguel válido (ID ou CPF) antes de confirmar.', 'err');
    return;
  }

  const formaPagamento = formaPagamentoSelect.value;
  if(!formaPagamento){
    toast('Selecione a forma de pagamento.', 'err');
    formaPagamentoSelect.focus();
    return;
  }

  // Se cartão → precisa escolher crédito/débito
  let formaFinal = formaPagamento;
  if ((formaPagamento || '').toLowerCase() === 'cartao') {
    if (!tipoCartaoSelect?.value) {
      toast('Selecione se é Crédito ou Débito.', 'err');
      tipoCartaoSelect?.focus();
      return;
    }
    formaFinal = `Cartão (${tipoCartaoSelect.value})`;
  }

  // Finaliza aluguel
  aluguelAtual.horaFim = new Date();
  aluguelAtual.danificado = patinsDanificadoCheckbox.checked;

  const diffMs = aluguelAtual.horaFim - aluguelAtual.horaInicio;
  const diffHoras = Math.ceil(diffMs / (1000*60*60));
  let total = diffHoras * precoPorHora;
  if (aluguelAtual.danificado) total += valorDano;

  aluguelAtual.total = total;
  aluguelAtual.formaPagamento = formaFinal;

  // Libera o par
  const patins = patinsDisponiveis.find(p => p.id === aluguelAtual.idPatins);
  if (patins) patins.disponivel = true;

  toast(`Devolução registrada. Total R$ ${formatBRL(total)}.`, 'ok');

  // Limpa painel e atualiza listagens
  formEncerrar.reset();
  dadosAluguelDiv.classList.add('hidden');
  erroEncerrarDiv.textContent = '';
  aluguelAtual = null;

  tipoCartaoField?.classList.add('hidden');
  if (tipoCartaoSelect) tipoCartaoSelect.value = '';

  renderConsultas();
  if (typeof relatorioCaixaDiv !== 'undefined') {
    relatorioCaixaDiv.classList.add('hidden');
  }
});

// ================================
// Fechamento de Caixa
// ================================
const btnGerarRelatorio = $('#btn-gerar-relatorio');
const relatorioCaixaDiv = $('#relatorio-caixa');
const totaisPagamentoUl = $('#totais-pagamento');
const totalFinalSpan = $('#total-final');
const btnConfirmarFechamento = $('#btn-confirmar-fechamento');

// Gerar relatório (pendentes não contabilizados)
btnGerarRelatorio.addEventListener('click', () => {
  const encerradosNaoContabilizados = alugueis.filter(a =>
    a.horaFim && a.formaPagamento && a.total && !a.contabilizado
  );

  relatorioPendentes  = [...encerradosNaoContabilizados];
  relatorioTotais     = {};
  relatorioTotalGeral = 0;

  relatorioPendentes.forEach(a => {
    if (!relatorioTotais[a.formaPagamento]) relatorioTotais[a.formaPagamento] = 0;
    relatorioTotais[a.formaPagamento] += a.total;
    relatorioTotalGeral += a.total;
  });

  // Render painel
  totaisPagamentoUl.innerHTML = '';
  Object.keys(relatorioTotais).forEach(forma => {
    const li = document.createElement('li');
    li.textContent = `${forma}: R$ ${formatBRL(relatorioTotais[forma])}`;
    totaisPagamentoUl.appendChild(li);
  });
  totalFinalSpan.textContent = formatBRL(relatorioTotalGeral);
  relatorioCaixaDiv.classList.remove('hidden');

  if (relatorioPendentes.length === 0) {
    toast('Sem movimentos pendentes para este fechamento.', 'ok');
  } else {
    toast('Relatório atualizado (pendentes).', 'ok');
  }
});

// Confirmar fechamento → abre relatório em nova guia e contabiliza
btnConfirmarFechamento.addEventListener('click', () => {
  if (!Array.isArray(relatorioPendentes) || relatorioPendentes.length === 0) {
    const pendentes = alugueis.filter(a =>
      a.horaFim && a.formaPagamento && a.total && !a.contabilizado
    );
    relatorioPendentes = [...pendentes];

    relatorioTotais = {};
    relatorioTotalGeral = 0;
    relatorioPendentes.forEach(a => {
      if (!relatorioTotais[a.formaPagamento]) relatorioTotais[a.formaPagamento] = 0;
      relatorioTotais[a.formaPagamento] += a.total;
      relatorioTotalGeral += a.total;
    });
  }

  abrirRelatorioPDF(relatorioPendentes, relatorioTotais, relatorioTotalGeral);

  let marcados = 0;
  alugueis.forEach(a => {
    if (relatorioPendentes.includes(a)) {
      a.contabilizado = true;
      marcados++;
    }
  });

  relatorioPendentes = [];
  relatorioTotais = {};
  relatorioTotalGeral = 0;

  relatorioCaixaDiv.classList.add('hidden');

  if (marcados === 0) toast('Nada para fechar. Já está tudo contabilizado.', 'ok');
  else toast(`Fechamento do caixa realizado (${marcados} lançamento(s)).`, 'ok');
});

// ================================
// Consultas (histórico)
// ================================
const tbodyAbertos = $('#tbody-abertos');
const tbodyEncerrados = $('#tbody-encerrados');

function renderConsultas(){
  // Em andamento
  tbodyAbertos.innerHTML = '';
  alugueis.filter(a=>!a.horaFim).forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.idPatins}</td>
      <td>${a.tamanho}</td>
      <td>${formatarCPF(a.cpf)}</td>
      <td>${formatDateTime(a.horaInicio)}</td>`;
    tbodyAbertos.appendChild(tr);
  });

  // Encerrados
  tbodyEncerrados.innerHTML = '';
  alugueis.filter(a=>a.horaFim).forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.idPatins}</td>
      <td>${a.tamanho}</td>
      <td>${formatarCPF(a.cpf)}</td>
      <td>${formatDateTime(a.horaInicio)}</td>
      <td>${formatDateTime(a.horaFim)}</td>
      <td>${a.danificado ? 'Sim' : 'Não'}</td>
      <td>${(a.formaPagamento||'')}</td>
      <td>${formatBRL(a.total)}</td>`;
    tbodyEncerrados.appendChild(tr);
  });
}
renderConsultas();