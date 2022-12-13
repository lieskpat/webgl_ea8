//Fragment Shader dienen unter anderem der Einfärbung
export default `
    precision mediump float;
    varying vec4 vColor;

    void main(){
        //vierdimensionaler Vektor vec4(1, 1, 1, 1, 1)
        //RGB + Alpha Kanal
        //vColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1);
        gl_FragColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1);
    }
`;
