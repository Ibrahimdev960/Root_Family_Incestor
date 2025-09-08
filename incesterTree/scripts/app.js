document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const treeVisualization = document.getElementById('treeVisualization');
    const treeWrapper = document.getElementById('treeWrapper');
    const treeContainer = document.getElementById('treeContainer');
    const addMemberBtn = document.getElementById('addMember');
    const clearTreeBtn = document.getElementById('clearTree');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetViewBtn = document.getElementById('resetView');
    const fullViewBtn = document.getElementById('fullView');
    const exportDataBtn = document.getElementById('exportData');
    const importFileInput = document.getElementById('importFile');
    
    // Modal elements
    const fullViewModal = document.getElementById('fullViewModal');
    const fullTreeContainer = document.getElementById('fullTreeContainer');
    const closeModal = document.querySelector('.close');
    
    // Tree data structure
    let familyTree = {
      name: 'Khair Ali',
      gender: 'male',
      children: [],
      expanded: true
    };
    
    // View state
    let scale = 1;
    let posX = 0;
    let posY = 0;
    let isDragging = false;
    let startX, startY;
    
    // Initialize the tree
    function init() {
      loadTree();
      renderTree();
      setupEventListeners();
    }
    
    // Load tree from localStorage
    function loadTree() {
      const savedTree = localStorage.getItem('familyTree');
      if (savedTree) {
        try {
          const parsedTree = JSON.parse(savedTree);
          // Ensure all nodes have the expanded property
          familyTree = addExpandedProperty(parsedTree);
        } catch (e) {
          console.error("Error parsing saved tree data:", e);
          alert("Error loading saved data. Starting with a fresh tree.");
          familyTree = {
            name: 'Khair Ali',
            gender: 'male',
            children: [],
            expanded: true
          };
        }
      }
    }
    
    // Recursively add expanded property to all nodes
    function addExpandedProperty(node) {
      const newNode = {...node};
      if (newNode.expanded === undefined) {
        newNode.expanded = true;
      }
      
      if (newNode.children && newNode.children.length > 0) {
        newNode.children = newNode.children.map(child => addExpandedProperty(child));
      }
      
      return newNode;
    }
    
    // Save tree to localStorage
    function saveTree() {
      try {
        localStorage.setItem('familyTree', JSON.stringify(familyTree));
      } catch (e) {
        console.error("Error saving tree to localStorage:", e);
        alert("Error saving data. The tree might be too large for localStorage.");
      }
    }
    
    // Find a person in the tree
    function findPerson(name, node = familyTree) {
      if (node.name === name) return node;
      
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const found = findPerson(name, child);
          if (found) return found;
        }
      }
      
      return null;
    }
    
    // Add a new family member
    function addFamilyMember(parentName, childName, gender) {
      // Input validation
      if (!parentName.trim() || !childName.trim()) {
        alert('Please enter valid names');
        return false;
      }
      
      const parent = findPerson(parentName);
      
      if (parent) {
        if (!parent.children) parent.children = [];
        
        // Check if child already exists
        const childExists = parent.children.some(child => child.name === childName);
        if (childExists) {
          alert(`A child named "${childName}" already exists for "${parentName}"`);
          return false;
        }
        
        parent.children.push({
          name: childName,
          gender: gender,
          children: [],
          expanded: true
        });
        
        // Expand the parent to show children
        parent.expanded = true;
        
        saveTree();
        return true;
      }
      
      return false;
    }
    
    // Toggle node expansion
    function toggleNode(node) {
      if (node.children && node.children.length > 0) {
        node.expanded = !node.expanded;
        saveTree();
        renderTree();
      }
    }
    
    // Render the tree visualization
    function renderTree() {
      treeVisualization.innerHTML = '';
      
      const treeLevel = document.createElement('div');
      treeLevel.className = 'level';
      
      const rootNode = createNodeElement(familyTree, true);
      treeLevel.appendChild(rootNode);
      
      treeVisualization.appendChild(treeLevel);
    }
    
    // Create a node element
    function createNodeElement(node, isRoot = false, isFullView = false) {
      const nodeContainer = document.createElement('div');
      nodeContainer.className = 'node';
      
      // Add connector if not the root node
      if (!isRoot) {
        const connector = document.createElement('div');
        connector.className = 'connector vertical-connector';
        nodeContainer.appendChild(connector);
      }
      
      const nodeContent = document.createElement('div');
      nodeContent.className = `node-content ${node.gender}`;
      if (isRoot) nodeContent.classList.add('main');
      nodeContent.textContent = node.name;
      nodeContent.addEventListener('click', () => toggleNode(node));
      
      // Add expand/collapse button if node has children
      if (node.children && node.children.length > 0) {
        const expandButton = document.createElement('div');
        expandButton.className = 'expand-button';
        expandButton.textContent = node.expanded ? '-' : '+';
        expandButton.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleNode(node);
        });
        nodeContent.appendChild(expandButton);
      }
      
      // Add details on hover
      const nodeDetails = document.createElement('div');
      nodeDetails.className = 'node-details';
      nodeDetails.textContent = `Click to ${node.expanded ? 'collapse' : 'expand'}`;
      nodeContainer.appendChild(nodeDetails);
      
      nodeContainer.appendChild(nodeContent);
      
      // Add children if any and if expanded
      if (node.children && node.children.length > 0 && node.expanded) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children';
        
        // Add horizontal connector above children
        if (node.children.length > 1) {
          const horizontalConnector = document.createElement('div');
          horizontalConnector.className = 'connector horizontal-connector';
          childrenContainer.appendChild(horizontalConnector);
        }
        
        node.children.forEach(child => {
          const childElement = createNodeElement(child, false, isFullView);
          childrenContainer.appendChild(childElement);
        });
        
        nodeContainer.appendChild(childrenContainer);
      }
      
      return nodeContainer;
    }
    
    // Render full tree view
    function renderFullTreeView() {
      fullTreeContainer.innerHTML = '';
      
      // Add search controls
      const searchControls = document.createElement('div');
      searchControls.className = 'search-controls';
      searchControls.innerHTML = `
        <input type="text" id="searchInput" placeholder="Search for a family member...">
        <button id="searchBtn" class="btn-primary">Search</button>
      `;
      fullTreeContainer.appendChild(searchControls);
      
      const fullTree = document.createElement('div');
      fullTree.className = 'full-tree';
      
      const treeLevel = document.createElement('div');
      treeLevel.className = 'level';
      
      // Create all nodes expanded for full view
      const rootNode = createFullViewNodeElement(familyTree, true);
      treeLevel.appendChild(rootNode);
      
      fullTree.appendChild(treeLevel);
      fullTreeContainer.appendChild(fullTree);
      
      // Add search functionality
      const searchInput = document.getElementById('searchInput');
      const searchBtn = document.getElementById('searchBtn');
      
      searchBtn.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
          highlightPerson(searchTerm);
        }
      });
      
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          const searchTerm = searchInput.value.trim();
          if (searchTerm) {
            highlightPerson(searchTerm);
          }
        }
      });
    }
    
    // Create node element for full view (all nodes expanded)
    function createFullViewNodeElement(node, isRoot = false) {
      const nodeContainer = document.createElement('div');
      nodeContainer.className = 'node';
      nodeContainer.setAttribute('data-name', node.name.toLowerCase());
      
      // Add connector if not the root node
      if (!isRoot) {
        const connector = document.createElement('div');
        connector.className = 'connector vertical-connector';
        nodeContainer.appendChild(connector);
      }
      
      const nodeContent = document.createElement('div');
      nodeContent.className = `node-content ${node.gender}`;
      if (isRoot) nodeContent.classList.add('main');
      nodeContent.textContent = node.name;
      
      nodeContainer.appendChild(nodeContent);
      
      // Add children if any
      if (node.children && node.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children';
        
        // Add horizontal connector above children
        if (node.children.length > 1) {
          const horizontalConnector = document.createElement('div');
          horizontalConnector.className = 'connector horizontal-connector';
          childrenContainer.appendChild(horizontalConnector);
        }
        
        node.children.forEach(child => {
          const childElement = createFullViewNodeElement(child);
          childrenContainer.appendChild(childElement);
        });
        
        nodeContainer.appendChild(childrenContainer);
      }
      
      return nodeContainer;
    }
    
    // Highlight a person in the full tree view
    function highlightPerson(name) {
      // Remove previous highlights
      const highlightedNodes = document.querySelectorAll('.highlighted');
      highlightedNodes.forEach(node => {
        node.classList.remove('highlighted');
      });
      
      // Find and highlight matching nodes
      const nodes = document.querySelectorAll('.full-tree .node');
      let found = false;
      
      nodes.forEach(node => {
        const nodeName = node.getAttribute('data-name');
        if (nodeName && nodeName.includes(name.toLowerCase())) {
          node.querySelector('.node-content').classList.add('highlighted');
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
          found = true;
        }
      });
      
      if (!found) {
        alert(`No family member found with name containing "${name}"`);
      }
    }
    
    // Export family tree data as JSON file
    function exportTreeData() {
      try {
        const dataStr = JSON.stringify(familyTree, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'family-tree.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } catch (e) {
        console.error("Error exporting data:", e);
        alert("Error exporting family tree data.");
      }
    }
    
    // Import family tree data from JSON file
    function importTreeData(file) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const contents = e.target.result;
          const importedTree = JSON.parse(contents);
          
          // Validate the imported data structure
          if (!importedTree.name || !importedTree.gender) {
            throw new Error("Invalid family tree data structure");
          }
          
          if (confirm("Importing data will replace your current family tree. Continue?")) {
            familyTree = addExpandedProperty(importedTree);
            saveTree();
            renderTree();
            alert("Family tree imported successfully!");
          }
        } catch (e) {
          console.error("Error importing data:", e);
          alert("Error importing family tree data. The file may be corrupted or invalid.");
        }
      };
      
      reader.onerror = function() {
        alert("Error reading file");
      };
      
      reader.readAsText(file);
    }
    
    // Setup event listeners
    function setupEventListeners() {
      // Add member button
      addMemberBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const parentName = document.getElementById('parent').value.trim();
        const childName = document.getElementById('child').value.trim();
        const gender = document.getElementById('gender').value;
        
        if (!parentName || !childName) {
          alert('Please enter both parent and child names');
          return;
        }
        
        if (addFamilyMember(parentName, childName, gender)) {
          renderTree();
          document.getElementById('parent').value = '';
          document.getElementById('child').value = '';
        } else {
          alert(`Parent "${parentName}" not found in the tree`);
        }
      });
      
      // Clear tree button
      clearTreeBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the entire tree?')) {
          familyTree = {
            name: 'Main Ancestor',
            gender: 'male',
            children: [],
            expanded: true
          };
          saveTree();
          renderTree();
        }
      });
      
      // Zoom controls
      zoomInBtn.addEventListener('click', function() {
        scale += 0.1;
        updateTransform();
      });
      
      zoomOutBtn.addEventListener('click', function() {
        scale -= 0.1;
        updateTransform();
      });
      
      resetViewBtn.addEventListener('click', function() {
        scale = 1;
        posX = 0;
        posY = 0;
        updateTransform();
      });
      
      // Full view button
      fullViewBtn.addEventListener('click', function() {
        renderFullTreeView();
        fullViewModal.style.display = 'block';
      });
      
      // Close modal
      closeModal.addEventListener('click', function() {
        fullViewModal.style.display = 'none';
      });
      
      // Close modal when clicking outside
      window.addEventListener('click', function(event) {
        if (event.target === fullViewModal) {
          fullViewModal.style.display = 'none';
        }
      });
      
      // Export data button
      exportDataBtn.addEventListener('click', exportTreeData);
      
      // Import file input
      importFileInput.addEventListener('change', function(e) {
        if (this.files && this.files.length > 0) {
          importTreeData(this.files[0]);
          this.value = ''; // Reset the input
        }
      });
      
      // Mouse wheel zoom
      treeWrapper.addEventListener('wheel', function(e) {
        e.preventDefault();
        scale += e.deltaY * -0.001;
        scale = Math.min(Math.max(0.1, scale), 3);
        updateTransform();
      });
      
      // Panning
      treeWrapper.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX - posX;
        startY = e.clientY - posY;
        treeWrapper.style.cursor = 'grabbing';
      });
      
      document.addEventListener('mouseup', function() {
        isDragging = false;
        treeWrapper.style.cursor = 'grab';
      });
      
      document.addEventListener('mousemove', function(e) {
        if (isDragging) {
          posX = e.clientX - startX;
          posY = e.clientY - startY;
          updateTransform();
        }
      });
    }
    
    // Update the transform of the tree container
    function updateTransform() {
      treeContainer.style.transform = `translate(calc(-50% + ${posX}px), calc(-50% + ${posY}px)) scale(${scale})`;
    }
    
    // Initialize the application
    init();
  });