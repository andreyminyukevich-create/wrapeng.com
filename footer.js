// footer.js — единый футер Keep1R CRM, подключается на каждой странице
(function() {
  const style = document.createElement('style');
  style.textContent = `
    #crm-footer {
      width: 100%;
      background: #f8fafc;
      border-top: 1px solid rgba(15,23,42,0.08);
      padding: 14px 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      flex-shrink: 0;
    }
    .crm-footer-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .crm-footer-brand {
      font-size: 0.72rem;
      color: #94a3b8;
      white-space: nowrap;
    }
    .crm-footer-links {
      display: flex;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
    }
    .crm-footer-links a {
      font-size: 0.72rem;
      color: #64748b;
      text-decoration: none;
      transition: color 0.15s;
      white-space: nowrap;
    }
    .crm-footer-links a:hover { color: #2563eb; }
    @media (max-width: 600px) {
      .crm-footer-inner { flex-direction: column; align-items: center; text-align: center; gap: 8px; }
      .crm-footer-links { justify-content: center; gap: 12px; }
    }
  `;
  document.head.appendChild(style);

  const footer = document.createElement('footer');
  footer.id = 'crm-footer';
  footer.innerHTML = `
    <div class="crm-footer-inner">
      <span class="crm-footer-brand">© 2025 Keep1R CRM · ИП Минюкевич А.А.</span>
      <nav class="crm-footer-links">
        <a href="user-agreement.html" target="_blank">Пользовательское соглашение</a>
        <a href="consent.html" target="_blank">Согласие на обработку ПДн</a>
        <a href="privacy-policy.html" target="_blank">Политика конфиденциальности</a>
      </nav>
    </div>
  `;
  document.body.appendChild(footer);
})();
