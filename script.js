// script.js

// Generar características aleatorias para las imágenes
function generateRandomFeatures() {
    let features = [];
    for (let i = 0; i < 10; i++) {
        let feature = Array.from({ length: 128 }, () => Math.random());
        features.push(feature);
    }
    return features;
}

// Función de distancia euclidiana
function euclideanDistance(a, b) {
    return Math.sqrt(a.reduce((sum, value, index) => sum + Math.pow(value - b[index], 2), 0));
}

// Nodo del VP-Tree
class VPNode {
    constructor(image, left = null, right = null, threshold = 0) {
        this.image = image;
        this.left = left;
        this.right = right;
        this.threshold = threshold;
    }
}

// VP-Tree
class VPTree {
    constructor(images) {
        this.images = images;
        this.root = this.buildTree(images);
    }

    buildTree(images) {
        if (images.length === 0) return null;

        // Elegir un pivote aleatorio
        let pivotIndex = Math.floor(Math.random() * images.length);
        let pivotImage = images[pivotIndex];

        // Calcular las distancias al pivote
        let distances = images.map(img => euclideanDistance(pivotImage.features, img.features));

        // Elegir umbral
        let medianDistance = this.median(distances);
        let leftImages = [];
        let rightImages = [];

        // Dividir en ramas izquierda y derecha
        images.forEach((img, index) => {
            if (distances[index] < medianDistance) {
                leftImages.push(img);
            } else if (index !== pivotIndex) {
                rightImages.push(img);
            }
        });

        return new VPNode(
            pivotImage,
            this.buildTree(leftImages),
            this.buildTree(rightImages),
            medianDistance
        );
    }

    median(values) {
        values.sort((a, b) => a - b);
        let mid = Math.floor(values.length / 2);
        return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
    }

    search(queryImage, n) {
        let heap = new MinHeap(n);
        this._search(this.root, queryImage, heap);
        return heap.getItems();
    }

    _search(node, queryImage, heap) {
        if (!node) return;

        let distance = euclideanDistance(queryImage.features, node.image.features);
        heap.add({ image: node.image, distance: distance });

        if (node.left === null && node.right === null) return;

        if (distance < node.threshold) {
            if (distance - heap.max().distance < node.threshold) this._search(node.left, queryImage, heap);
            if (distance + heap.max().distance >= node.threshold) this._search(node.right, queryImage, heap);
        } else {
            if (distance + heap.max().distance >= node.threshold) this._search(node.right, queryImage, heap);
            if (distance - heap.max().distance < node.threshold) this._search(node.left, queryImage, heap);
        }
    }
}

class MinHeap {
    constructor(size) {
        this.size = size;
        this.items = [];
    }

    add(item) {
        if (this.items.length < this.size) {
            this.items.push(item);
            this.items.sort((a, b) => a.distance - b.distance);
        } else if (item.distance < this.items[this.size - 1].distance) {
            this.items[this.size - 1] = item;
            this.items.sort((a, b) => a.distance - b.distance);
        }
    }

    max() {
        return this.items[this.items.length - 1];
    }

    getItems() {
        return this.items.map(item => item.image);
    }
}

$(document).ready(function() {
    let images = generateRandomFeatures().map((features, index) => ({ src: `images/image${index + 1}.jpg`, features }));
    let vpTree = new VPTree(images);

    $('#searchButton').click(function() {
        let inputImage = $('#inputImage')[0].files[0];
        if (!inputImage) {
            alert("Por favor, selecciona una imagen.");
            return;
        }

        // Generar características aleatorias para la imagen de entrada
        let queryFeatures = Array.from({ length: 128 }, () => Math.random());
        let queryImage = { features: queryFeatures };

        let results = vpTree.search(queryImage, 5);
        displayResults(results);
    });
});

function displayResults(results) {
    let resultsDiv = $('#results');
    resultsDiv.empty();
    results.forEach(image => {
        resultsDiv.append(`<img src="${image.src}" alt="Imagen Similar">`);
    });
}
