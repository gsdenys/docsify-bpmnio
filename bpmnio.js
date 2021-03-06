//escape function to mantain the XML consistent when inside the
//HTML property
function escape(string) {
  var chatMap = {
    "&": "&amp;",
    "'": "&#x27;",
    "`": "&#x60;",
    '"': "&quot;",
    "<": "&lt;",
    ">": "&gt;",
  };
  
  if (typeof string !== "string") return string;
  
  return string.replace(/[&'`"<>]/g, function (match) {
    return chatMap[match];
  });
}


/* ######################################
 *                 MODAL
 * ######################################
 */

(function () {
	document.querySelectorAll(".open-modal").forEach(function (trigger) {
		trigger.addEventListener("click", function () {
			hideAllModalWindows();
			showModalWindow(this);
		});
	});
	
	document.querySelectorAll(".modal-hide").forEach(function (closeBtn) {
		closeBtn.addEventListener("click", function () {
			hideAllModalWindows();
		});
	});
})();

function showModalWindow () {
	var modalTarget = "#bpmnio-modal-panel";
	
	document.querySelector(".modal-fader").className += " active";
	document.querySelector(modalTarget).className += " active";
}

function hideAllModalWindows () {
	var modalFader = document.querySelector(".modal-fader");
	var modalWindows = document.querySelectorAll(".modal-window");
	
	if(modalFader.className.indexOf("active") !== -1) {
		modalFader.className = modalFader.className.replace("active", "");
	}
	
	modalWindows.forEach(function (modalWindow) {
		if(modalWindow.className.indexOf("active") !== -1) {
			modalWindow.className = modalWindow.className.replace("active", "");
		}
	});
}

/* ######################################
 *             DOCUMENTATION
 * ######################################
 */
const getHTML = function(title, doc) {
  var button = `<button class="modal-btn modal-hide" onclick="closeModal()">Close</button>`
  var father = `<div class="modal-fader"></div>`

  return `<div id="bpmnio-modal-panel" class="modal-window">
                <h2>${title}</h2>
                <p>${doc}</p>
                <div class="modal-footer-btn">${button}</div>
            </div>${father}`
}

const closeModal = function() {
  hideAllModalWindows()
  document.getElementById('bpmnio-modal-panel').remove()
}

const createModal = function (el, title, doc) {
  var modal = document.createElement("div")

  modal.innerHTML = getHTML(title, doc)

  el._container.parentNode.appendChild(modal);

  showModalWindow ()
}

const ignoretype = [
  'bpmn:Collaboration',
  'label',
  "bpmn:Participant"
]

/// load heatmap after the bpmn is loaded
function genereteDoc(bpmnJS, canvas) {
  var registry = bpmnJS.get('elementRegistry');
  var canvas = bpmnJS.get('canvas');

  eventElements = []

  for (var i in registry.getAll()) {
      var element = registry.getAll()[i];

      var id   = element.id
      var type = element.type
      var name = element.businessObject.name
      var doc  = element.businessObject.documentation

      if (doc && !ignoretype.includes(type)) {
          var el = canvas.getGraphics(element)

          var dc = doc[0].text.replaceAll("\n", "</p><p>")

          eventElements.push({el, id, type, name,  dc})
      }
  }

  Array.from(eventElements).forEach(element => {
      element.el.onmouseenter = function () {
          element.el.style.cursor = "pointer"
      }

      element.el.onmouseleave = function () {
          element.el.style.cursor = "default"
      }

      element.el.onclick = function () {
          createModal(canvas, element.name, element.dc)
      }
  })
}

/* ######################################
 *               CONVERTER
 * ######################################
 */
(function () {
  var idList = []
  const dtPrefix = "data"
  
  /**
   * BPMN diagram docsify converter
   * 
   * @param {*} xml the XML data
   * @returns the HTML to render
   */
  window.bpmnioConverter = function (xml) {  
    var randomID = Date.now() + Math.floor(Math.random() * 100001);
    var idx = `bpmnio-${randomID}`

    //add the element ID to a render list
    idList.push(idx)
    
    //create return tags
    var dataDiv = `<div bpmnioData="${escape(xml)}" id="${dtPrefix}-${idx}"></div>`
    var viewer  = `<div class="bpmnio-viewer" id="${idx}">${dataDiv}</div>`
    
    return `${viewer}`;
  };

  /**
   * Obtains and separate the svg images inside element. There is just 2 SVG images
   * inside the element, the first one is the logo and the second the diagram
   * 
   * @param {*} element the element
   * @returns the object containing the SVGs
   */
  const svgElement = function(element) {
    var svgList = element.getElementsByTagName("svg")

    var logo = svgList[0]
    var diagram = svgList[1]

    return { logo, diagram }
  }

  /**
   * Obtain the ideal size to print the logo without overlap the diagram
   * 
   * @param {*} logo the svg logo
   * @returns the y size of logo
   */
  const logoReservedSpace = function(logo) {
    //multiplication factor to reserv space to bpmio logo. It is important
    //to avoid the logo be printed over the diagram
    var mult = 2

    var size = logo.getBoundingClientRect().height

    return (size*mult)
  }

  /**
   * Get the diagram scale factor in %. It's based on how much the diagram
   * need to scale itself to obtains a better presentation.
   * 
   * @param {*} diagram the svg diagram
   * @returns the resize factor in %
   */
  const getScaleFactor = function(diagram) {
    var image = diagram.children[0];

    var imageX = image.getBoundingClientRect().width;
    var canvasX = diagram.getBoundingClientRect().width;
    
    return (canvasX / imageX)
  }
  
  /**
   * Resizes y based on x scale factor. This function basically identify the
   * X resize factor in % and apply the same to the Y
   *  
   * @param {*} diagram the svg diagram
   * @param {*} element the elemet to be resized
   * @param {*} logoSpace the space reserved to logo
   */
  const resizeY = function(diagram, element, logoSpace) {
    var image = diagram.children[0];
    
    var scale = getScaleFactor(diagram)

    y = image.getBoundingClientRect().height * scale + logoSpace
    
    element.style.height = y + "px"
  }

  /**
   * scale canvas function that adjust the element to the x and y size
   * providing a better visualization.
   *  
   * @param {*} element 
   * @param {*} canvas 
   */
  const scaleCanvas = function(element, canvas) {
    // svgList = element.getElementsByTagName("svg")
    var svg = svgElement(element)

    var logoSpace = logoReservedSpace(svg.logo)
    
    resizeY(svg.diagram, element, logoSpace)

    canvas.zoom('fit-viewport')
  }

  /**
   * Create the canvas element. Then remove the xml storage tag
   * 
   * @param {*} element the element to be rendered
   * @param {*} iodata the xml tag data
   * @returns canvas
   */
  const createCanvas = async function(element, iodata) {
    //get XML data and remove remporary data from the page
    xmlData = iodata.getAttribute("bpmnioData")
    iodata.remove()
    
    const viewer = new BpmnJS({ container: `#${element.id}` });
    var canvas = viewer.get("canvas");
    
    await viewer.importXML(xmlData)

    genereteDoc(viewer, canvas)

    return canvas
  }


  /**
   * Render function to print BPMIO canvas at the page.
   * 
   * @param {*} element locale to render element
   * @param {*} iodata contains the XML data
   */
  const render = async function(element, iodata) {
     createCanvas(element, iodata).then((canvas) => {
      new ResizeObserver(function(){
        scaleCanvas(element, canvas)
      }).observe(element)
    
      scaleCanvas(element, canvas)
    })
  }


  /**
   * Lookup the element based in their ID. This function wait until the element 
   * are rendered and then call for the render function
   * 
   * @param {*} id
   */
  const lookupElement = async function(id) {
    var stop = setInterval(() => {
      var element = document.getElementById(id)

      if (element) {
        clearInterval(stop)

        var dtElement = document.getElementById(`${dtPrefix}-${id}`)
        render(element, dtElement)
      }
    }, 100);
  }
  
  /**
   * Installation function responsible to start redering all diagrams 
   * at the selected page
   * 
   * @param {*} hook 
   */
  const install = function (hook) {
    hook.doneEach((hook) => {
      Array.from(idList).forEach((idx) => lookupElement(idx))
    });
  };
  
  //add this plugin to the docsify plugin list
  window.$docsify.plugins = [].concat(install, $docsify.plugins);
})();
