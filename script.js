let treeData = null;
let nodeCounter = 0;

function generateTree() {
    const input = document.getElementById('tree-data').value.trim();
    const statusDiv = document.getElementById('tree-status');
    const treeContainer = document.getElementById('tree-container');
    const summaryDiv = document.getElementById('tree-summary');
    
    // Limpiar resultados anteriores
    treeContainer.innerHTML = '';
    statusDiv.innerHTML = '';
    summaryDiv.innerHTML = '';
    document.getElementById('results-table').innerHTML = '';
    
    if (!input) {
        statusDiv.innerHTML = '<p class="error">Error: No se ingresaron datos.</p>';
        return;
    }
    
    try {
        treeData = parseInput(input);
        if (!validateTree(treeData)) {
            return;
        }
        
        statusDiv.innerHTML = '<p class="success">Árbol generado correctamente.</p>';
        drawTree(treeData);
        displayTreeSummary(treeData);
    } catch (error) {
        statusDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

function parseInput(input) {
    const lines = input.split('\n').filter(line => line.trim() !== '');
    const nodes = {};
    let root = null;
    
    for (const line of lines) {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length !== 3) {
            throw new Error(`Formato incorrecto en línea: "${line}". Debe ser "id,valor,padre"`);
        }
        
        const [id, value, parentId] = parts;
        
        if (nodes[id]) {
            throw new Error(`ID duplicado: ${id}`);
        }
        
        nodes[id] = {
            id: id,
            name: value,
            parent: parentId === 'null' ? null : parentId,
            children: []
        };
        
        if (parentId === 'null') {
            if (root !== null) {
                throw new Error('Solo puede haber un nodo raíz (con padre "null")');
            }
            root = id;
        }
    }
    
    if (root === null) {
        throw new Error('No se encontró nodo raíz (con padre "null")');
    }
    
    // Construir la estructura jerárquica
    for (const id in nodes) {
        const node = nodes[id];
        if (node.parent !== null) {
            if (!nodes[node.parent]) {
                throw new Error(`Padre no encontrado para nodo ${id}: ${node.parent}`);
            }
            nodes[node.parent].children.push(node);
        }
    }
    
    return nodes[root];
}

function validateTree(tree) {
    const statusDiv = document.getElementById('tree-status');
    
    // Verificar si es un árbol de decisión válido
    // Un árbol de decisión debe tener:
    // 1. Nodos internos (preguntas/atributos)
    // 2. Nodos hoja (resultados)
    
    let hasLeafNodes = false;
    let hasDecisionNodes = false;
    let queue = [tree];
    
    while (queue.length > 0) {
        const node = queue.shift();
        
        if (node.children.length === 0) {
            hasLeafNodes = true; // Nodo hoja
        } else {
            hasDecisionNodes = true; // Nodo de decisión
            queue.push(...node.children);
        }
    }
    
    if (!hasLeafNodes || !hasDecisionNodes) {
        statusDiv.innerHTML = '<p class="error">No se puede generar un árbol de decisión válido. Motivo: ';
        if (!hasLeafNodes && !hasDecisionNodes) {
            statusDiv.innerHTML += 'solo hay un nodo sin estructura de árbol.';
        } else if (!hasLeafNodes) {
            statusDiv.innerHTML += 'no hay nodos hoja (resultados).';
        } else {
            statusDiv.innerHTML += 'no hay nodos de decisión (atributos).';
        }
        statusDiv.innerHTML += '</p>';
        return false;
    }
    
    return true;
}

function drawTree(treeData) {
    const container = document.getElementById('tree-container');
    const width = container.clientWidth;
    const height = 500;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(50,50)");
    
    // Estructura jerárquica para d3
    const root = d3.hierarchy(treeData, d => d.children);
    
    // Configurar layout del árbol
    const treeLayout = d3.tree().size([width - 100, height - 100]);
    treeLayout(root);
    
    // Dibujar enlaces
    svg.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y));
    
    // Crear grupos de nodos
    const node = svg.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);
    
    // Agregar círculos a los nodos
    node.append("circle")
        .attr("r", 10)
        .attr("fill", d => d.children ? "steelblue" : "#ff7f0e");
    
    // Agregar texto a los nodos (ID y valor)
    node.append("text")
        .attr("dy", ".35em")
        .attr("y", d => d.children ? -20 : 20)
        .style("text-anchor", "middle")
        .text(d => `${d.data.id}: ${d.data.name}`);
}

function displayTreeSummary(treeData) {
    const summaryDiv = document.getElementById('tree-summary');
    let nodeCount = 0;
    let leafCount = 0;
    let maxDepth = 0;
    let levels = {};
    
    // Recorrer el árbol para calcular estadísticas
    function traverse(node, depth) {
        nodeCount++;
        maxDepth = Math.max(maxDepth, depth);
        
        if (!levels[depth]) {
            levels[depth] = 0;
        }
        levels[depth]++;
        
        if (node.children.length === 0) {
            leafCount++;
        } else {
            node.children.forEach(child => {
                traverse(child, depth + 1);
            });
        }
    }
    
    traverse(treeData, 0);
    
    // Mostrar resumen
    summaryDiv.innerHTML = `
        <p><strong>Resumen del Árbol:</strong></p>
        <ul>
            <li>Nodos totales: ${nodeCount}</li>
            <li>Nodos hoja (resultados): ${leafCount}</li>
            <li>Nodos de decisión: ${nodeCount - leafCount}</li>
            <li>Profundidad máxima: ${maxDepth}</li>
            <li>Nodos por nivel:
                <ul>
                    ${Object.entries(levels).map(([level, count]) => 
                        `<li>Nivel ${level}: ${count} nodos</li>`).join('')}
                </ul>
            </li>
        </ul>
    `;
}

function runBFS() {
    if (!treeData) {
        alert('Primero genere un árbol válido');
        return;
    }
    
    const visited = [];
    const queue = [treeData];
    
    while (queue.length > 0) {
        const node = queue.shift();
        visited.push(node.id);
        
        for (const child of node.children) {
            queue.push(child);
        }
    }
    
    displayAlgorithmResults('Búsqueda por Amplitud (BFS)', visited);
}

function runDFS() {
    if (!treeData) {
        alert('Primero genere un árbol válido');
        return;
    }
    
    const visited = [];
    const stack = [treeData];
    
    while (stack.length > 0) {
        const node = stack.pop();
        visited.push(node.id);
        
        // Empujar hijos en orden inverso para procesar de izquierda a derecha
        for (let i = node.children.length - 1; i >= 0; i--) {
            stack.push(node.children[i]);
        }
    }
    
    displayAlgorithmResults('Búsqueda por Profundidad (DFS)', visited);
}

function displayAlgorithmResults(algorithm, visitedOrder) {
    const resultsTable = document.getElementById('results-table');
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${algorithm}</td>
        <td>${visitedOrder.join(' → ')}</td>
        <td>${visitedOrder.length}</td>
    `;
    
    resultsTable.appendChild(row);
}