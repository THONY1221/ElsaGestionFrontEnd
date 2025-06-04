// Déclaration de module pour html2pdf.js
declare module "html2pdf.js" {
  function html2pdf(): {
    from: (element: HTMLElement) => any;
    set: (options: any) => any;
    save: () => any;
    then: (callback: Function) => any;
  };

  export = html2pdf;
}
