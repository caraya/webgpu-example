// Request WebGPU adapter and device (promises)
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("WebGPU is not supported on this device or browser.");
}
const device = await adapter.requestDevice();

// Prepare input data
const inputA = new Float32Array([1, 2, 3, 4]);
const inputB = new Float32Array([10, 20, 30, 40]);
const count = inputA.length;  // number of elements (should match inputB.length)

// Create GPU buffers for input and output
const bufferA = device.createBuffer({
  size: inputA.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
});
const bufferB = device.createBuffer({
  size: inputB.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
});

// This buffer is used as the output of the compute shader
const bufferOutput = device.createBuffer({
  size: inputA.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
});

// This buffer is used to read data back to the CPU
const bufferReadback = device.createBuffer({
  size: inputA.byteLength,
  usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
});

// Upload data to GPU
device.queue.writeBuffer(bufferA, 0, inputA);
device.queue.writeBuffer(bufferB, 0, inputB);

// Create shader module
const shaderModule = device.createShaderModule({
  code: `
    @group(0) @binding(0) var<storage, read> inputA : array<f32>;
    @group(0) @binding(1) var<storage, read> inputB : array<f32>;
    @group(0) @binding(2) var<storage, read_write> result : array<f32>;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
      let index = GlobalInvocationID.x;
      result[index] = inputA[index] + inputB[index];
    }
  `
});

// Create bind group layout and bind group
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }
  ]
});

const pipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
  compute: {
    module: shaderModule,
    entryPoint: "main"
  }
});

const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    { binding: 0, resource: { buffer: bufferA } },
    { binding: 1, resource: { buffer: bufferB } },
    { binding: 2, resource: { buffer: bufferOutput } }
  ]
});

// Encode compute pass
const commandEncoder = device.createCommandEncoder();
const passEncoder = commandEncoder.beginComputePass();
passEncoder.setPipeline(pipeline);
passEncoder.setBindGroup(0, bindGroup);
passEncoder.dispatchWorkgroups(count);
passEncoder.end();

// Copy result to the readable buffer
commandEncoder.copyBufferToBuffer(bufferOutput, 0, bufferReadback, 0, inputA.byteLength);

// Submit commands
const gpuCommands = commandEncoder.finish();
device.queue.submit([gpuCommands]);

// Read result back to CPU
await bufferReadback.mapAsync(GPUMapMode.READ);
const copyArrayBuffer = bufferReadback.getMappedRange();
const resultArray = new Float32Array(copyArrayBuffer.slice(0));
console.log("Result:", resultArray);
bufferReadback.unmap();

export { }