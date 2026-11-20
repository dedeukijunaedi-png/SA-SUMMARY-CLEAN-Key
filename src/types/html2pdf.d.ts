declare module "html2pdf.js" {
  interface Html2PdfWorker {
    from(element: HTMLElement | string): Html2PdfWorker;
    set(opt: any): Html2PdfWorker;
    save(filename?: string): Promise<void>;
    outputPdf(type?: string): Promise<any>;
  }

  function html2pdf(): Html2PdfWorker;
  function html2pdf(element: HTMLElement | string, opt?: any): Html2PdfWorker;

  export default html2pdf;
}
