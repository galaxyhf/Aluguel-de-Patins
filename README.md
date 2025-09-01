# 🛼 Sistema de Aluguel de Patins

[👉 Acesse o sistema aqui](https://aluguelpatins.netlify.app)

Um sistema simples de **PDV para aluguel de patins**, feito em **HTML, CSS e JavaScript puro**, rodando 100% no navegador (sem backend).

---

## ✨ Funcionalidades

- **Novo aluguel**
  - Seleção de tamanho do patins (35–44).
  - Verificação de disponibilidade em tempo real.
  - Registro automático de hora inicial.
  - Validação e máscara de CPF.

- **Encerramento de aluguel**
  - Busca por **ID do par** ou **CPF**.
  - Cálculo automático do valor a pagar por hora.
  - Acréscimo por patins danificado.
  - Registro da forma de pagamento.

- **Consultas**
  - Aba **Em andamento**: lista de alugueis ativos.
  - Aba **Encerrados**: histórico completo de devoluções.

- **Fechamento de caixa**
  - Relatório com totais por forma de pagamento e total geral.
  - Geração de relatório em **PDF** (abre em nova aba com botão “Baixar/Imprimir”).

---

## 🖼️ Capturas de tela

> *(adicione aqui prints das telas principais: Novo Aluguel, Consultas, Fechamento de Caixa)*

---

## 🛠️ Tecnologias usadas

- **HTML5** – Estrutura das páginas  
- **CSS3** – Tema moderno com cores em degradê azul/roxo  
- **JavaScript (ES6)** – Lógica de aluguel, devolução, relatórios e cálculos  

---

## 🚀 Como usar

1. Acesse o sistema diretamente pelo navegador:  
   👉 [https://aluguelpatins.netlify.app](https://aluguelpatins.netlify.app)

2. Funciona também **offline**: basta baixar/clonar este repositório e abrir o arquivo `index.html` no navegador.

---

## ⚙️ Personalização

- **Preço por hora**: edite `precoPorHora` no `script.js`.
- **Taxa por dano**: edite `valorDano` no `script.js`.
- **Cores do tema**: ajuste as variáveis em `styles.css`.
