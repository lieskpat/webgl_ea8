//Fragment Shader dienen unter anderem der Einfärbung
export default `

    precision mediump float;
            
    varying vec4 vColor;
            
    void main() {
        gl_FragColor = vColor;
    }

`;
