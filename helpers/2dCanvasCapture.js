import html2canvas from "html2canvas";

export default function canvasCapture(fileName, element){

  var html = document.getElementsByTagName('HTML')[0]
  var body =  document.getElementsByTagName('BODY')[0]

  var htmlWidth = html.clientWidth;
  var bodyWidth = body.clientWidth;
  var newWidth = element.scrollWidth - element.clientWidth

  if (newWidth > element.clientWidth){
    htmlWidth += newWidth
    bodyWidth += newWidth
  }

  html.style.width = htmlWidth + 'px';
  body.style.width = bodyWidth + 'px';

  [].forEach.call(element.querySelectorAll('.hide-on-capture'), function (el) {
    el.style.display = 'none';
  });

  html2canvas(element).then((canvas)=>{
    canvas.toBlob(blob => navigator.clipboard.write([new ClipboardItem({'image/png': blob})]));

    var image = canvas.toDataURL('image/png', 1.0);
    fileName = fileName + " - " + new Date().toString() +'.png'
    saveAs(image, fileName);

    [].forEach.call(element.querySelectorAll('.hide-on-capture'), function (el) {
      el.style.display = '';
    });

  })
}

const saveAs = (blob, fileName) =>{

  var elem = window.document.createElement('a');
  elem.href = blob
  elem.download = fileName;
  elem.style = 'display:none;';
  (document.body || document.documentElement).appendChild(elem);

  if (typeof elem.click === 'function') {
    elem.click();
  } else {
    elem.target = '_blank';
    elem.dispatchEvent(new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    }));
  }

  URL.revokeObjectURL(elem.href);
  elem.remove()

}