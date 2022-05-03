# docsify-bpmnio

This is a docsify plugin that can convert BPMN xml data to a picture in your docs.

## First - write your drawio File Path in Your Markdown File

```md
[filename](https://cdn.jsdelivr.net/npm/docsify-drawio/test.bpmn ':include :type=bpmn')
```

## Second - Add these lines in your docsify html File.

!! It must put in the header section 

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/docsify-bpmnio/style.css" />
<script src="https://cdn.jsdelivr.net/npm/docsify-bpmnio/viewer.min.js"></script>
<script src='https://cdn.jsdelivr.net/npm/docsify-bpmnio/bpmnio.js'></script>
```

## Third - Add A Markdown render function in your $docsify.

```js
window.$docsify = {
    // You just have to copy it to Your own html File
    markdown: {
      renderer: {

        code: function (bpmn, lang) {
          if (lang === 'bpmn') {
            if (window.bpmnioConverter) {
              return window.bpmnioConverter(bpmn)
            } else {
              return `<div class='bpmnio-code'>No bpmn.io converter</div>`
            }
          } else {
            return this.origin.code.apply(this, arguments);
          }
        }
      }
    },
  };
```
