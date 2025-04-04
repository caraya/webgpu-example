const canvas = document.querySelector('canvas')!;
// Request WebGPU adapter and device (promises)
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("WebGPU is not supported on this device or browser.");
}const device = await adapter.requestDevice();


// Configure the canvas context for WebGPU
const context = canvas.getContext('webgpu') as GPUCanvasContext;
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({ device: device, format: presentationFormat });

// Write WGSL shaders for the triangle (vertex and fragment in one module)
const wgslShaders = `
  @vertex
  fn vs_main(@builtin(vertex_index) idx : u32) -> @builtin(position) vec4f {
    // Define an array of 3 positions in clip space (z=0, w=1 implicitly)
    var pos = array<vec2f, 3>(
      vec2f(0.0,  0.5),   // top center
      vec2f(-0.5, -0.5),  // bottom left
      vec2f( 0.5, -0.5)   // bottom right
    );
    // Return the position for the vertex with index idx
    return vec4f(pos[idx], 0.0, 1.0);
  }

  @fragment
  fn fs_main() -> @location(0) vec4f {
    return vec4f(1.0, 0.0, 0.0, 1.0);  // solid red color
  }
`;
const shaderModule = device.createShaderModule({ code: wgslShaders });

// Create a render pipeline with the above shaders
const pipeline = device.createRenderPipeline({
  layout: "auto",
  vertex: {
    module: shaderModule,
    entryPoint: "vs_main"
  },
  fragment: {
    module: shaderModule,
    entryPoint: "fs_main",
    targets: [{ format: presentationFormat }]
  },
  primitive: {
    topology: "triangle-list"
  }
});

// Encode commands to render the triangle
const commandEncoder = device.createCommandEncoder();
const renderPass = commandEncoder.beginRenderPass({
  colorAttachments: [{
    view: context.getCurrentTexture().createView(),
    clearValue: { r: 0, g: 0, b: 0, a: 1 },  // clear to black
    loadOp: 'clear',
    storeOp: 'store'
  }]
});
renderPass.setPipeline(pipeline);
renderPass.draw(3, 1, 0, 0);  // draw 3 vertices (one triangle)
renderPass.end();
device.queue.submit([commandEncoder.finish()]);

export { };
