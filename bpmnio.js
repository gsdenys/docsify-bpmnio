//escape function to mantain the HTML consistent when inside the 
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


(function () {

    window.bpmnioConverter = function (xml, idx = new Date().getTime()) {
        return `<div class="bpmnio-viewer" id="bpmnio-${idx}">
                   <div bpmnioData="${escape(xml)}"></div>
                </div>
                <span id="replacement-bpmnio-${idx}"></span>`
    };

    const manageTags = function (element) {
        var parent = element.parentElement

        var svg = element.getElementsByTagName('svg')[1]

        var l = document.getElementById(`replacement-${element.id}`)

        parent.replaceChild(svg, l)

        element.remove()
    }

    const getScale = function (canvas) {
        var sizeImageX = canvas._svg.children[0].getBoundingClientRect().width
        var sizeContainerX = canvas._svg.clientWidth

        var scale = sizeContainerX / sizeImageX

        return (scale < 1) ? scale : 1
    }

    const bpmnInformation = function (element) {
        var bpmnContentElement = element.children[0]

        var id = '#' + element.id
        var xml = bpmnContentElement.getAttribute('bpmnioData')

        bpmnContentElement.remove()

        return { id, xml }
    }

    const execute = function () {
        var elements = document.getElementsByClassName('bpmnio-viewer')

        Array.from(elements).forEach((el) => {
            var info = bpmnInformation(el)

            const viewer = new BpmnJS({ container: info.id });
            var canvas = viewer.get('canvas')

            viewer.importXML(info.xml).then(({ warnings }) => {
                el.getElementsByTagName('svg')[1].currentScale = getScale(canvas)
                manageTags(el)
            })
        });
    }

    const install = function (hook) {
        hook.doneEach((hook) => {
            try {
                execute()
            } catch { }
        });
    };

    window.$docsify.plugins = [].concat(install, $docsify.plugins);
})();

function ready() {
    var svgList = document.getElementsByTagName('svg')

    Array.from(svgList).forEach((svg) => {
        var g = svg.children[0]

        if (g) {
            var svgSizeX = g.getBoundingClientRect().width
            var svgPositionX = g.getBoundingClientRect().x
            var divPositionX = svg.getBoundingClientRect().x

            svg.style.width = svgSizeX + (svgPositionX - divPositionX) + "px"

            var svgSizeY = g.getBoundingClientRect().height
            var svgPositionY = g.getBoundingClientRect().y
            var divPositionY = svg.getBoundingClientRect().y

            svg.style.height = svgSizeY + (svgPositionY - divPositionY) + "px"
        }
    });
}

window.onload = function () {
    setTimeout(ready, 340)
}

