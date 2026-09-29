import '@testing-library/jest-dom';

if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
    this.setAttribute('open', '');
  };

  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
