class SellAuthEmbed {
  constructor() {
    window.addEventListener('load', () => {
      // ❌ this.injectCaptcha() removido daqui
      this.injectStyles();
    });
  }

  // ❌ injectCaptcha() e createAndSolveCaptcha() removidos totalmente

  injectStyles() {
    if (document.getElementById('sellauth-embed-style')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'sellauth-embed-style';
    style.textContent = `
      .sellauth-button { display: flex; align-items: center; gap: 0.5rem; }
      .sellauth-button[data-checking-out] { opacity: 0.5; pointer-events: none; }
      .sellauth-button svg { width: 1.25rem; height: 1.25rem; }
      .sellauth-button[data-checking-out] .icon.spinner { display: inline-block; animation: spin 1s linear infinite; }
      .sellauth-button[data-checking-out] .icon.cart { display: none; }
      .sellauth-button:not([data-checking-out]) .icon.spinner { display: none; }
      .sellauth-button:not([data-checking-out]) .icon.cart { display: inline-block; }
      #sellauth-modal { position: relative; max-width: 100vw; margin: auto; padding: 0; border: none; border-radius: 0.75rem; background-color: #141414; color: #ffffff; scrollbar-width: none; -ms-overflow-style: none; }
      #sellauth-modal::-webkit-scrollbar { display: none; }
      #sellauth-modal .close { position: absolute; top: 1.5rem; right: 1.125rem; padding: 0.25rem; border: none; outline: none; cursor: pointer; background: none; color: #ffffff; }
      #sellauth-modal [role="alertdialog"] { padding: 0; overflow: hidden; }
      #sellauth-modal::backdrop { background: rgba(0, 0, 0, 0.75); }
      #sellauth-modal[open] { animation: zoom 0.25s ease-out; }
      #sellauth-modal[open]::backdrop { animation: fade 0.25s ease-out; }
      #sellauth-modal iframe { width: 98vw; height: 46rem; border: none; }
      @media (min-width: 768px) { #sellauth-modal { max-width: 32rem; } #sellauth-modal iframe { width: 32rem; height: 52rem; } }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes zoom { from { transform: scale(0.75); } to { transform: scale(1); } }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    `;
    (document.head || document.body).appendChild(style);
  }

  async checkout(button, { cart, shopId, affiliate = null, metadata = null, modal = true, scrollTop = true }) {
    if (this.isCheckingOut) {
      return;
    }

    this.isCheckingOut = true;

    if (button && button instanceof HTMLElement) {
      button.setAttribute('data-checking-out', '');
    }

    try {
      const response = await fetch('https://api-internal-3.sellauth.com/v1/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart, shopId, affiliate, metadata }), 
      });

      const responseData = await response.json();

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      if (!responseData.url) {
        throw new Error('No checkout URL returned. Please try again.');
      }

      if (modal) {
        this.openModal(responseData.url, scrollTop);
      } else {
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIos) {
          window.location.href = responseData.url; 
        } else {
          window.open(responseData.url, '_blank');
        }
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }

    this.isCheckingOut = false;

    if (button && button instanceof HTMLElement) {
      button.removeAttribute('data-checking-out');
    }
  }

  openModal(url, scrollTop = true) {
    this.closeModal();

    const modalDiv = document.createElement('div');
    const dialog = document.createElement('dialog');
    dialog.id = 'sellauth-modal';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close';
    closeBtn.onclick = () => window.sellAuthEmbed.closeModal();
    closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>';

    const alertDiv = document.createElement('div');
    alertDiv.setAttribute('role', 'alertdialog');

    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', url);
    iframe.title = 'SellAuth Embed';
    iframe.referrerPolicy = 'no-referrer';
    iframe.allow = 'payment; clipboard-write';

    alertDiv.appendChild(iframe);
    dialog.appendChild(closeBtn);
    dialog.appendChild(alertDiv);
    modalDiv.appendChild(dialog);

    document.body.appendChild(modalDiv);
    document.getElementById('sellauth-modal').showModal();

    if (scrollTop) {
      window.scrollTo(0, 0);
    }

    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    const modal = document.getElementById('sellauth-modal');
    if (modal) {
      modal.remove();
    }
    document.body.style.overflow = '';
  }
}

window.sellAuthEmbed = new SellAuthEmbed();