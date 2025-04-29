document.getElementById('treeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const width = parseInt(document.getElementById('width').value);
    const depth = parseInt(document.getElementById('depth').value);
    const nodePrefix = document.getElementById('nodePrefix').value;
    const formMessage = document.getElementById('formMessage');
    const treeMessage = document.getElementById('treeMessage');
    
    // Validar entrada
    if (width < 2 || width > 3) {
        formMessage.innerHTML = '<p class="error">El ancho del árbol debe ser entre 2 y 3 nodos hijos.</p>';
        return;
    }
    
    if (depth < 1) {
        formMessage.innerHTML = '<p class="error">La profundidad debe ser al menos 1.</p>';
        return;
    }
    
    formMessage.innerHTML = '<p class="success">Configuración válida. Generando árbol...</p>';
    
    // Generar árbol
    const treeData = generateTree(width, depth, nodePrefix);
    
    // Dibujar árbol
    drawTree(treeData);
    
    // Mostrar resumen y búsquedas
    showTreeSummary(treeData);
    performSearches(treeData);
});

function generateTree(width, depth, prefix) {
    let counter = 0;
    
    function buildNode(currentDepth, parentId = null) {
        if (currentDepth > depth) return null;
        
        const nodeId = parentId ? 
            `${prefix}${parentId.split(prefix)[1]}_${++counter}` : 
            `${prefix}${++counter}`;
        
        const node = {
            id: nodeId,
            name: nodeId,
            children: []
        };
        
        if (currentDepth < depth) {
            for (let i = 0; i < width; i++) {
                const child = buildNode(currentDepth + 1, nodeId);
                if (child) {
                    node.children.push(child);
                }
            }
        }
        
        return node;
    }
    
    return buildNode(1);
}

function drawTree(treeData) {
    // Limpiar el diagrama anterior
    d3.select("#treeDiagram").html("");
    
    if (!treeData) {
        document.getElementById('treeMessage').innerHTML = 
            '<p class="error">No se pudo generar el árbol con los parámetros proporcionados.</p>';
        return;
    }
    
    document.getElementById('treeMessage').innerHTML = 
        '<p class="success">Árbol generado exitosamente.</p>';
    
    // Configuración del árbol
    const margin = {top: 40, right: 90, bottom: 50, left: 90};
    const width = document.getElementById('treeDiagram').clientWidth - margin.left - margin.right;
    const height = document.getElementById('treeDiagram').clientHeight - margin.top - margin.bottom;
    
    // Crear el layout del árbol
    const treeLayout = d3.tree().size([width, height]);
    
    // Crear la jerarquía
    const root = d3.hierarchy(treeData);
    const treeNodes = treeLayout(root);
    
    // Crear SVG
    const svg = d3.select("#treeDiagram")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Agregar links (las líneas entre nodos)
    svg.selectAll('.link')
        .data(treeNodes.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y));
    
    // Crear grupos de nodos
    const node = svg.selectAll('.node')
        .data(treeNodes.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`);
    
    // Agregar círculos a los nodos
    node.append('circle')
        .attr('r', 10);
    
    // Agregar texto a los nodos
    node.append('text')
        .attr('dy', '.31em')
        .attr('y', d => d.children ? -20 : 20)
        .style('text-anchor', 'middle')
        .text(d => d.data.name);
}

function showTreeSummary(treeData) {
    if (!treeData) return;
    
    const summaryDiv = document.getElementById('treeSummary');
    
    // Contar nodos
    function countNodes(node) {
        if (!node.children || node.children.length === 0) return 1;
        return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
    }
    
    // Contar hojas
    function countLeaves(node) {
        if (!node.children || node.children.length === 0) return 1;
        return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
    }
    
    const totalNodes = countNodes(treeData);
    const totalLeaves = countLeaves(treeData);
    
    summaryDiv.innerHTML = `
        <h3>Resumen del Árbol</h3>
        <p><strong>Nodo raíz:</strong> ${treeData.id}</p>
        <p><strong>Total de nodos:</strong> ${totalNodes}</p>
        <p><strong>Nodos hoja:</strong> ${totalLeaves}</p>
        <p><strong>Profundidad máxima:</strong> ${document.getElementById('depth').value}</p>
        <p><strong>Ancho máximo (hijos por nodo):</strong> ${document.getElementById('width').value}</p>
    `;
}

function performSearches(treeData) {
    if (!treeData) return;
    
    const resultsDiv = document.getElementById('searchResults');
    
    // Búsqueda en amplitud (BFS)
    function bfs(node) {
        const queue = [node];
        const result = [];
        
        while (queue.length > 0) {
            const current = queue.shift();
            result.push(current.id);
            
            if (current.children) {
                for (const child of current.children) {
                    queue.push(child);
                }
            }
        }
        
        return result;
    }
    
    // Búsqueda en profundidad (DFS) - Preorden
    function dfs(node) {
        const result = [];
        
        function traverse(current) {
            result.push(current.id);
            
            if (current.children) {
                for (const child of current.children) {
                    traverse(child);
                }
            }
        }
        
        traverse(node);
        return result;
    }
    
    const bfsResult = bfs(treeData);
    const dfsResult = dfs(treeData);
    
    resultsDiv.innerHTML = `
        <h3>Resultados de Búsqueda</h3>
        <h4>Búsqueda en Amplitud (BFS)</h4>
        <p>Orden de visita: ${bfsResult.join(' → ')}</p>
        <pre>${JSON.stringify(bfsResult, null, 2)}</pre>
        
        <h4>Búsqueda en Profundidad (DFS - Preorden)</h4>
        <p>Orden de visita: ${dfsResult.join(' → ')}</p>
        <pre>${JSON.stringify(dfsResult, null, 2)}</pre>
    `;
}