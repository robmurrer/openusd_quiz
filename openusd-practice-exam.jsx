import { useState, useEffect, useRef } from "react";

const QUESTIONS = [
  {id:1,domain:"Composition",type:"single",question:"In USD's composition strength ordering (LIVRPS), which arc has the STRONGEST opinion?",options:["Local opinions","Inherits","References","Specializes"],correct:[0],explanation:"LIVRPS stands for Local, Inherits, VariantSets, References, Payloads, Specializes — ordered from strongest to weakest. Local opinions always win."},
  {id:2,domain:"Composition",type:"single",question:"What is the primary difference between a Reference and a Payload in USD?",options:["References are for assets, Payloads are for materials","Payloads can be deferred (unloaded) while References are always loaded","References use .usda files, Payloads use .usdc files","There is no functional difference; they are aliases"],correct:[1],explanation:"Payloads are a 'deferred' composition arc — they can be unloaded to reduce memory usage. References are always composed into the stage."},
  {id:3,domain:"Composition",type:"single",question:"Which composition arc would you use to create switchable LOD (Level of Detail) configurations on an asset?",options:["Sublayers","Inherits","VariantSets","Specializes"],correct:[2],explanation:"VariantSets allow you to define named sets of switchable opinions, making them ideal for LODs, material variations, or regional configurations."},
  {id:4,domain:"Composition",type:"single",question:"Given the following Python code, what prim path will the referenced asset's root be mapped to?\n\nstage.GetPrimAtPath('/World/Car').GetReferences().AddReference('./car.usd')",options:["/car","/World/Car","/World/Car/car","The referenced root prim's original path"],correct:[1],explanation:"When you add a reference on a prim, the referenced asset's default prim (or root) is mapped onto that target prim path — /World/Car in this case."},
  {id:5,domain:"Composition",type:"single",question:"What does 'encapsulation' mean in the context of USD references?",options:["Referenced data is encrypted for security","Opinions from inside a reference cannot affect prims outside that reference's namespace","All referenced files are packaged into a single .usdz archive","Referenced prims cannot be overridden by local opinions"],correct:[1],explanation:"Encapsulation ensures that composition arcs within a referenced asset cannot 'reach outside' and affect prims elsewhere in the stage hierarchy."},
  {id:6,domain:"Composition",type:"single",question:"In LIVRPS ordering, where do VariantSet opinions fall in strength?",options:["Stronger than Local, weaker than Inherits","Stronger than References, weaker than Inherits","Stronger than Payloads, weaker than References","Weakest of all arcs"],correct:[1],explanation:"LIVRPS: Local > Inherits > VariantSets > References > Payloads > Specializes. VariantSets sit between Inherits and References."},
  {id:7,domain:"Composition",type:"single",question:"Which composition arc should you use when you want a prim to inherit properties from a 'class' prim (like /_class_Material) so that future changes to the class propagate?",options:["References","Specializes","Inherits","Sublayers"],correct:[2],explanation:"Inherits create a live link where the inheriting prim receives all opinions from the class prim. Changes to the class propagate automatically."},
  {id:8,domain:"Composition",type:"single",question:"What happens when two sublayers define conflicting opinions on the same attribute of the same prim?",options:["An error is raised and the stage fails to compose","The stronger (earlier/higher-priority) sublayer's opinion wins","The weaker (later) sublayer's opinion wins","Both opinions are averaged"],correct:[1],explanation:"In sublayer composition, layers listed earlier (or with higher priority in the sublayer list) have stronger opinions and take precedence."},
  {id:9,domain:"Composition",type:"single",question:"How does 'Specializes' differ from 'Inherits' in USD?",options:["Specializes is stronger than Inherits","Specializes is weaker than all other arcs, allowing base-class updates to show through more readily","Specializes can only be used with typed schemas","There is no difference; they are interchangeable"],correct:[1],explanation:"Specializes is the weakest arc in LIVRPS. This means opinions from most other arcs override specializes, allowing base-class refinements to remain as gentle defaults."},
  {id:10,domain:"Composition",type:"single",question:"What is a 'sublayer' in USD?",options:["A prim nested inside another prim","A layer composited on top of or beneath the current layer, sharing the same namespace","A compressed layer stored inside a .usdz archive","A render pass layer used by Hydra"],correct:[1],explanation:"Sublayers stack layers that share the same prim namespace. They're the simplest composition arc and are commonly used for editorial overrides."},
  {id:11,domain:"Composition",type:"single",question:"What Python API call would you use to add an internal reference (same file) to a prim?",options:["prim.GetReferences().AddInternalReference(Sdf.Path('/Source'))","prim.GetReferences().AddReference('', '/Source')","prim.AddInternalReference('/Source')","Usd.References.AddInternal(prim, '/Source')"],correct:[1],explanation:"An internal reference uses an empty asset path ('') with the target prim path. The API is prim.GetReferences().AddReference('', '/Source')."},
  {id:12,domain:"Composition",type:"multi",question:"Which of the following are valid composition arcs in USD? (Select all that apply)",options:["Sublayers","Connections","Payloads","Specializes"],correct:[0,2,3],explanation:"Sublayers, Payloads, and Specializes are all composition arcs. Connections are a relationship mechanism (e.g., shader connections) but NOT a composition arc."},
  {id:13,domain:"Composition",type:"single",question:"When debugging composition, what tool can you use to see which layer an opinion originated from?",options:["UsdGeom.ComputeExtent()","Usd.PrimCompositionQuery or usdview's Composition tab","Sdf.Layer.Reload()","UsdShade.MaterialBindingAPI"],correct:[1],explanation:"Usd.PrimCompositionQuery lets you programmatically inspect composition arcs. In usdview, the Composition tab visualizes the arc stack for any selected prim."},
  {id:14,domain:"Composition",type:"single",question:"What is the 'defaultPrim' metadata used for?",options:["It specifies which prim is selected by default in usdview","It identifies the root prim that is referenced when no explicit prim path is given in a reference or payload","It sets the default material for the stage","It marks the prim as the scene's camera"],correct:[1],explanation:"defaultPrim tells USD which prim to use as the target when a layer is referenced/payloaded without specifying an explicit prim path."},
  {id:15,domain:"Composition",type:"single",question:"If a prim has both an inherit arc to /_class_Vehicle and a reference to car.usd, and both define 'color', which value wins?",options:["The reference value, because references are stronger","The inherit value, because inherits are stronger than references","It depends on the file format","Both values are kept as a list"],correct:[1],explanation:"In LIVRPS, Inherits (I) are stronger than References (R). So the opinion from the inherited class prim wins over the referenced asset's opinion."},
  {id:16,domain:"Data Exchange",type:"single",question:"When building a USD exporter from a DCC tool, which approach best preserves round-trip fidelity?",options:["Export everything to a single flattened .usda file","Map the DCC's scene graph to USD's prim hierarchy, using schemas that match the data semantics","Convert all geometry to OBJ first, then import to USD","Store all data as custom string attributes"],correct:[1],explanation:"Mapping DCC concepts to appropriate USD schemas (UsdGeom for geometry, UsdShade for materials, etc.) preserves semantic meaning and enables round-trip workflows."},
  {id:17,domain:"Data Exchange",type:"single",question:"What is the .usdz file format?",options:["A compressed ZIP archive with lossy geometry compression","An uncompressed ZIP archive containing a USD file and its dependencies (textures, etc.)","A binary-only format that cannot contain .usda files","A streaming format designed for real-time collaboration"],correct:[1],explanation:"USDZ is a zero-compression ZIP archive that packages a root USD layer with all its dependencies (textures, etc.) into a single distributable file."},
  {id:18,domain:"Data Exchange",type:"single",question:"Which USD utility can be used to validate a USD file for correctness and compliance?",options:["usdview","usdchecker","usdcat","usddiff"],correct:[1],explanation:"usdchecker validates USD files against compliance rules, checks for common errors, and is especially useful for validating .usdz packages for AR platforms."},
  {id:19,domain:"Data Exchange",type:"single",question:"When converting FBX animation data to USD, how should animated transforms be represented?",options:["As string metadata on the root prim","As timeSampled values on UsdGeom.Xformable transform attributes","As a separate JSON sidecar file","As vertex colors on the mesh"],correct:[1],explanation:"USD represents animation through timeSamples on attributes. For transforms, UsdGeom.Xformable provides xformOp attributes that accept timeSampled values."},
  {id:20,domain:"Data Exchange",type:"single",question:"What does the 'usdcat' command-line tool do?",options:["Validates USD file compliance","Renders a USD stage to an image","Outputs a composed or unflattened view of a USD file in .usda text format","Converts USD to Alembic"],correct:[2],explanation:"usdcat reads USD files and outputs them in text (.usda) format. It can flatten composition or output specific layers, making it useful for debugging and inspection."},
  {id:21,domain:"Data Exchange",type:"single",question:"What is the recommended way to handle texture paths in a USD asset intended for distribution?",options:["Use absolute filesystem paths","Use relative paths or asset-relative paths so the asset is portable","Embed textures as base64 strings in attributes","Always use HTTP URLs"],correct:[1],explanation:"Relative or asset-relative paths ensure USD files remain portable across different machines and filesystems. This is critical for distribution and .usdz packaging."},
  {id:22,domain:"Data Exchange",type:"single",question:"What role does an ArResolver (Asset Resolver) play in USD?",options:["It resolves merge conflicts between layers","It translates asset path strings into actual filesystem or network locations","It resolves rendering shader compilation errors","It compresses assets for network transfer"],correct:[1],explanation:"The ArResolver plugin system translates logical asset paths (like asset:car.usd) into concrete filesystem paths, enabling custom asset management integration."},
  {id:23,domain:"Data Exchange",type:"single",question:"When exporting materials from a DCC to USD, which material standard provides the best cross-platform compatibility?",options:["Arnold Standard Surface only","UsdPreviewSurface","V-Ray materials","Raw GLSL shaders"],correct:[1],explanation:"UsdPreviewSurface is USD's built-in, renderer-agnostic material definition designed for broad compatibility. It works with most Hydra render delegates and AR platforms."},
  {id:24,domain:"Data Exchange",type:"multi",question:"Which of the following are valid USD file formats? (Select all that apply)",options:[".usda",".usdc",".usdz",".usdx"],correct:[0,1,2],explanation:".usda (ASCII text), .usdc (binary Crate), and .usdz (packaged archive) are valid USD formats. .usdx does not exist."},
  {id:25,domain:"Data Exchange",type:"single",question:"What is 'flattening' a USD stage?",options:["Removing all animation data","Collapsing all composition arcs and layers into a single layer with resolved values","Converting 3D geometry to 2D","Compressing the file size"],correct:[1],explanation:"Flattening evaluates all composition arcs and merges every opinion into a single layer, producing a standalone file with no external dependencies or composition."},
  {id:26,domain:"Pipeline Development",type:"single",question:"In a large studio pipeline, why is it recommended to separate assets into multiple layers (model, material, animation)?",options:["USD cannot store more than one type of data per file","It enables parallel workflows where departments can work on the same asset simultaneously without conflicts","Multiple layers render faster than single layers","It is required by the USD specification"],correct:[1],explanation:"Layer separation enables parallel, non-destructive workflows. Modelers, look-dev artists, and animators can work on separate layers that sublayer together."},
  {id:27,domain:"Pipeline Development",type:"single",question:"What is the purpose of 'asset resolution' in a pipeline context?",options:["Determining the final pixel color of rendered assets","Mapping logical asset identifiers to physical file locations, supporting versioning and caching","Resolving Python import conflicts","Checking assets for polygon count limits"],correct:[1],explanation:"Asset resolution is the pipeline mechanism that translates logical asset paths into concrete locations, enabling version management, caching, and environment-specific overrides."},
  {id:28,domain:"Pipeline Development",type:"single",question:"What is the recommended layer structure for a shot in a VFX pipeline?",options:["A single flattened file containing everything","A shot layer that sublayers department layers (layout, animation, FX, lighting), each referencing published assets","One layer per frame of animation","Only .usdc files for performance"],correct:[1],explanation:"A layered shot structure uses sublayers per department, with each layer referencing version-controlled assets. This enables non-destructive collaboration."},
  {id:29,domain:"Pipeline Development",type:"single",question:"Why would you use 'payload' arcs instead of 'reference' arcs for heavy geometry assets in a pipeline?",options:["Payloads have better compression","Payloads can be unloaded to reduce memory, enabling faster stage traversal of large scenes","Payloads support animation, references do not","There is no practical difference"],correct:[1],explanation:"Payloads support selective loading/unloading. In large scenes with hundreds of assets, unloading payloads drastically reduces memory and speeds up stage traversal."},
  {id:30,domain:"Pipeline Development",type:"single",question:"How do you programmatically open a USD stage and save modifications in Python?",options:["stage = Usd.Stage.Open('scene.usd'); ... stage.GetRootLayer().Save()","stage = Usd.Load('scene.usd'); ... stage.Write()","stage = Sdf.Layer.Open('scene.usd'); ... stage.Commit()","stage = UsdGeom.Open('scene.usd'); ... stage.Export()"],correct:[0],explanation:"Usd.Stage.Open() opens a stage. To save, you call Save() on the root layer (or edit target layer). The stage itself doesn't have a Save() method — layers do."},
  {id:31,domain:"Pipeline Development",type:"single",question:"What is the 'edit target' of a USD stage?",options:["The prim currently selected for editing in a GUI","The specific layer where new opinions will be authored when modifying the stage","The render delegate used for viewport display","The target frame rate for animation playback"],correct:[1],explanation:"The edit target determines which layer receives new opinions when you author data through the stage API. You can switch it to write to different sublayers."},
  {id:32,domain:"Pipeline Development",type:"single",question:"What is the purpose of 'metersPerUnit' and 'upAxis' stage metadata?",options:["They control texture resolution","They define the stage's coordinate system conventions for interoperability across tools","They set animation frame rate","They are required only for physics simulations"],correct:[1],explanation:"metersPerUnit and upAxis establish the stage's spatial conventions (scale and orientation), which are critical for interoperability between DCCs with different defaults."},
  {id:33,domain:"Pipeline Development",type:"single",question:"In a pipeline using USD, what does 'publishing' an asset typically involve?",options:["Uploading the asset to a social media platform","Validating, versioning, and writing the asset to a shared location where it can be referenced by downstream consumers","Converting the asset to FBX format","Deleting all composition arcs"],correct:[1],explanation:"Publishing involves validation (usdchecker), version control, and placing the asset in a managed repository so shots and assemblies can reference a stable version."},
  {id:34,domain:"Pipeline Development",type:"multi",question:"Which of the following are valid reasons to use the Sdf API instead of the Usd stage API? (Select all that apply)",options:["You need to author opinions without triggering composition","You want to work on a single layer in isolation","You need faster performance for batch operations on layer data","You want to query the fully composed stage"],correct:[0,1,2],explanation:"The Sdf API works at the layer level without composition overhead. It's useful for batch editing, layer manipulation, and authoring opinions without triggering recomposition. Querying the composed stage requires the Usd API."},
  {id:35,domain:"Data Modeling",type:"single",question:"What is a 'prim' in USD?",options:["A rendering primitive like a triangle","The primary container for scene data, forming nodes in the scene hierarchy","A Python primitive data type","A type of animation key"],correct:[1],explanation:"Prims are the fundamental scene description elements in USD. They form a hierarchical namespace and contain properties (attributes and relationships)."},
  {id:36,domain:"Data Modeling",type:"single",question:"What is the difference between an 'attribute' and a 'relationship' in USD?",options:["Attributes store typed data values; relationships point to other prims or properties","Attributes are read-only; relationships are read-write","Attributes are for geometry; relationships are for materials","There is no difference"],correct:[0],explanation:"Attributes hold typed values (float, int, string, matrix, etc.) and can be time-sampled. Relationships are 'pointers' that target other prims or properties in the stage."},
  {id:37,domain:"Data Modeling",type:"single",question:"What are 'primvars' in USD?",options:["Variables that control prim visibility","Primitive variables: attributes that can interpolate across geometric primitives (per-vertex, per-face, etc.)","Environment variables set before opening a stage","Preview variables for draft rendering"],correct:[1],explanation:"Primvars (primitive variables) are special attributes that carry interpolation metadata, allowing values to vary across a mesh (per-vertex colors, UVs, etc.)."},
  {id:38,domain:"Data Modeling",type:"single",question:"What is a 'typed schema' vs. an 'API schema' in USD?",options:["Typed schemas define prim types (IsA); API schemas add behaviors to existing prims (HasA)","Typed schemas are written in C++; API schemas are Python-only","Typed schemas are for geometry; API schemas are for metadata","They are the same thing with different names"],correct:[0],explanation:"Typed schemas define what a prim IS (e.g., UsdGeom.Mesh, UsdLux.DistantLight). API schemas add capabilities to any prim (e.g., CollectionAPI, MaterialBindingAPI)."},
  {id:39,domain:"Data Modeling",type:"single",question:"What are 'timeSamples' used for in USD?",options:["Marking layers with creation timestamps","Storing attribute values at specific time codes to represent animation or simulation data","Sampling the system clock for performance profiling","Defining the duration of a stage in seconds"],correct:[1],explanation:"TimeSamples store attribute values at discrete time codes. USD interpolates between them. They're the fundamental mechanism for animation data in USD."},
  {id:40,domain:"Data Modeling",type:"single",question:"What is the prim specifier 'over' used for?",options:["Defining a completely new prim","Specifying that the prim definition provides overrides to an existing prim without creating it if it doesn't exist","Marking a prim as deleted","Creating an abstract class prim"],correct:[1],explanation:"'over' means the prim spec only provides opinions if the prim already exists from another arc. Unlike 'def', it won't create the prim on its own."},
  {id:41,domain:"Data Modeling",type:"single",question:"What are the three prim specifiers in USD?",options:["def, over, class","prim, attr, rel","mesh, xform, scope","define, override, abstract"],correct:[0],explanation:"'def' defines a concrete prim, 'over' provides overrides only, and 'class' defines an abstract prim (typically used as an inherit target)."},
  {id:42,domain:"Data Modeling",type:"single",question:"How does USD resolve the final value of an attribute that has both a 'default' value and timeSamples?",options:["The default value always wins","TimeSamples always win over the default value when querying at a specific time","They are averaged together","An error is raised"],correct:[1],explanation:"When both exist on the same prim spec, timeSamples take precedence over the default value for time-based queries. The default is used only when no timeSamples are present."},
  {id:43,domain:"Debugging & Troubleshooting",type:"single",question:"A referenced asset is not appearing in your composed stage. What is the FIRST thing you should check?",options:["Whether the GPU driver is up to date","Whether the referenced file exists and the path resolves correctly","Whether the render delegate supports the asset's materials","Whether Python is installed correctly"],correct:[1],explanation:"Path resolution failures are the #1 cause of missing references. Check that the file exists, the path is correct (relative vs absolute), and the ArResolver can find it."},
  {id:44,domain:"Debugging & Troubleshooting",type:"single",question:"You see unexpected values on a prim's attribute. How can you trace which layer is providing the winning opinion?",options:["Use print statements in your Python script","Use Usd.PrimCompositionQuery or check the attribute's value source with GetResolveInfo()","Restart the application","Check the system environment variables"],correct:[1],explanation:"UsdResolveInfo and PrimCompositionQuery let you trace exactly which layer and arc is contributing the winning opinion, essential for debugging composition."},
  {id:45,domain:"Debugging & Troubleshooting",type:"single",question:"Your stage is loading very slowly due to heavy geometry. What is the most effective optimization?",options:["Convert all files to .usda format","Use payloads for heavy assets and load only what's needed using stage load rules","Delete all materials","Increase system RAM"],correct:[1],explanation:"Payloads enable selective loading. Combined with Usd.Stage load rules (LoadNone + selective loading), you can dramatically reduce initial load times."},
  {id:46,domain:"Debugging & Troubleshooting",type:"single",question:"What does the 'usddiff' command-line tool do?",options:["Computes the visual difference between two rendered images","Shows the differences between two USD layers or stages","Calculates mesh topology differences","Merges two conflicting USD files"],correct:[1],explanation:"usddiff compares two USD files and outputs their differences, similar to a text diff but USD-aware. It's invaluable for debugging unexpected changes between versions."},
  {id:47,domain:"Debugging & Troubleshooting",type:"single",question:"A material binding is not taking effect on a mesh. Which of these should you investigate?",options:["Whether the mesh has enough polygons","Whether the material binding relationship target path is valid and the material prim exists at that path","Whether the .usda file is read-only","Whether the mesh has vertex normals"],correct:[1],explanation:"Material bindings use relationships. If the target path is wrong or the material prim doesn't exist, the binding silently fails. Check the relationship target path."},
  {id:48,domain:"Debugging & Troubleshooting",type:"single",question:"What does the TF_DEBUG environment variable mechanism provide in USD?",options:["GPU debugging for render delegates","Detailed diagnostic logging for specific USD subsystems at runtime","Python breakpoint support","Network traffic analysis"],correct:[1],explanation:"TF_DEBUG enables fine-grained diagnostic output for specific USD systems (composition, asset resolution, change processing, etc.), invaluable for troubleshooting."},
  {id:49,domain:"Debugging & Troubleshooting",type:"single",question:"You notice that edits you make through the stage API are not being saved. What is the most likely cause?",options:["The stage is corrupted","The edit target is set to a different layer than the one you're trying to save","USD does not support saving","The prim is locked by another user"],correct:[1],explanation:"A common mistake: the edit target layer determines where stage API edits go. If it's set to a session layer or different sublayer, your edits won't be on the layer you're saving."},
  {id:50,domain:"Content Aggregation",type:"single",question:"What is 'scenegraph instancing' in USD?",options:["Duplicating prims by copy-pasting them in the hierarchy","A mechanism where multiple prims share the same composed scenegraph subtree to reduce memory","Creating instances of a Python class","Rendering multiple viewports simultaneously"],correct:[1],explanation:"Scenegraph instancing allows prims marked as instanceable to share composed subtrees, significantly reducing memory for scenes with many copies of the same asset."},
  {id:51,domain:"Content Aggregation",type:"single",question:"How do you mark a prim as instanceable in USD?",options:["Set the 'instanceable' metadata to true on the prim","Name the prim with an '_instance' suffix","Use UsdGeom.Instance schema","Add it to a Collection"],correct:[0],explanation:"Setting prim.SetInstanceable(True) marks a prim as instanceable. USD will then share its composed prototype with other identically-referenced instanceable prims."},
  {id:52,domain:"Content Aggregation",type:"single",question:"What is 'point instancing' in USD and when would you use it?",options:["Instancing geometry at each vertex of a mesh","UsdGeom.PointInstancer places prototype geometry at thousands of transform locations, ideal for crowds/vegetation","Instancing individual points in a point cloud","A Hydra-only rendering optimization"],correct:[1],explanation:"PointInstancer efficiently places prototypes at many positions/orientations/scales. It's optimized for massive instancing scenarios like forests, crowds, or particle systems."},
  {id:53,domain:"Content Aggregation",type:"single",question:"What is the model 'kind' hierarchy in USD?",options:["A file type classification system","A hierarchy (model > group/assembly/component) that organizes prims for efficient traversal and selection","A rendering quality setting","A versioning scheme for assets"],correct:[1],explanation:"The kind hierarchy (model → group, assembly, component) enables efficient scene traversal. Tools can quickly find 'component' assets or 'assembly' sets without traversing every prim."},
  {id:54,domain:"Content Aggregation",type:"single",question:"What is the difference between a 'component' and an 'assembly' in USD's kind hierarchy?",options:["Components are larger than assemblies","Components are leaf-level publishable assets; assemblies are collections of components","Assemblies can be animated; components cannot","There is no functional difference"],correct:[1],explanation:"Components are the smallest publishable unit (a chair, a tree). Assemblies are composed of multiple components (a room, a forest). This supports hierarchical asset management."},
  {id:55,domain:"Content Aggregation",type:"single",question:"When aggregating assets into a set/environment, what is the advantage of using references with payloads?",options:["It makes the files smaller on disk","Sets can be opened quickly with payloads unloaded, then selectively loaded for detail work","It enables real-time collaboration","It automatically generates LODs"],correct:[1],explanation:"Payloaded references let you open massive environment files quickly (payloads unloaded), then selectively load only the assets you need to work on."},
  {id:56,domain:"Content Aggregation",type:"single",question:"What does setting a prim's 'active' metadata to false do?",options:["Deletes the prim from disk","Deactivates the prim so it and its descendants are excluded from stage traversal and rendering","Hides it in the viewport but keeps it in traversal","Marks it as needing review"],correct:[1],explanation:"Setting active=false effectively 'mutes' a prim and its subtree. They remain in the scene description but are skipped by default traversal and rendering."},
  {id:57,domain:"Visualization",type:"single",question:"What is 'Hydra' in the USD ecosystem?",options:["A mesh compression algorithm","USD's rendering architecture that connects scene data to render delegates","A Python package for data visualization","NVIDIA's proprietary renderer"],correct:[1],explanation:"Hydra is the rendering framework that sits between USD scene data and render delegates (Storm, RenderMan, Arnold, etc.), providing a unified rendering interface."},
  {id:58,domain:"Visualization",type:"single",question:"What is a 'render delegate' in Hydra?",options:["A user who is responsible for the final render","A plugin that implements the actual rendering backend (e.g., Storm for OpenGL, HdPrman for RenderMan)","A layer that stores render settings","A thread that delegates render tasks to the GPU"],correct:[1],explanation:"Render delegates are Hydra plugins that handle actual image generation. Storm (OpenGL/Vulkan), HdPrman (RenderMan), and HdArnold are common examples."},
  {id:59,domain:"Visualization",type:"single",question:"What is the 'purpose' attribute on a UsdGeom prim used for?",options:["Documenting why the prim was created","Controlling visibility by categorizing geometry as 'default', 'render', 'proxy', or 'guide'","Setting the rendering priority order","Defining the prim's role in physics simulation"],correct:[1],explanation:"Purpose categorizes geometry for selective display: 'render' for final quality, 'proxy' for lightweight viewport stand-ins, 'guide' for helper geometry visible only in authoring."},
  {id:60,domain:"Visualization",type:"single",question:"How is a UsdPreviewSurface material connected to a mesh in USD?",options:["By naming the material the same as the mesh","Through a material binding relationship authored via UsdShadeMaterialBindingAPI","By placing the material prim as a child of the mesh prim","Materials are automatically assigned based on prim type"],correct:[1],explanation:"Material bindings use the MaterialBindingAPI to create a relationship from the mesh (or ancestor) to the material prim. This is the standard USD binding mechanism."},
  {id:61,domain:"Visualization",type:"single",question:"In UsdGeom, what is the role of 'Xform' prims?",options:["They define geometry topology","They provide a transformable grouping node in the scene hierarchy","They store vertex positions","They define light emission properties"],correct:[1],explanation:"Xform prims are transform nodes that provide a local-to-parent transformation matrix. They're used to group, position, rotate, and scale their descendant geometry."},
  {id:62,domain:"Customizing USD",type:"single",question:"How can you define a custom schema in USD?",options:["By writing a JSON configuration file","By authoring a schema definition (.usda) file and running usdGenSchema to generate C++ and Python code","By subclassing UsdPrim in Python","Custom schemas are not supported in USD"],correct:[1],explanation:"Custom schemas are defined in a schema.usda file with the appropriate class declarations. usdGenSchema then generates the C++ classes and Python bindings."},
  {id:63,domain:"Customizing USD",type:"single",question:"What is a 'codeless schema' in USD?",options:["A schema that cannot be used in code","A schema defined only in a generatedSchema.usda file that requires no compiled C++ plugin","A schema that uses visual scripting instead of code","A deprecated schema format"],correct:[1],explanation:"Codeless schemas provide custom typed or API schemas without requiring compiled C++ code. They're defined purely in USD files and are useful for pipeline-specific metadata."},
  {id:64,domain:"Customizing USD",type:"single",question:"What is a USD file format plugin?",options:["A text editor plugin for syntax highlighting .usda files","A plugin that allows USD to read/write non-native file formats (e.g., Alembic .abc) as if they were USD layers","A compression plugin for .usdc files","A plugin that adds new prim types to usdview"],correct:[1],explanation:"File format plugins allow USD to transparently read/write foreign formats as layers. The Alembic plugin (usdAbc) is the most well-known example."},
  {id:65,domain:"Customizing USD",type:"single",question:"When creating a custom 'kind', what must you register it with?",options:["The operating system registry","The KindRegistry via a plugin","The Hydra render delegate","The USD Python module __init__.py"],correct:[1],explanation:"Custom kinds are registered through the KindRegistry, typically via a plugInfo.json plugin file that declares the new kind and its position in the kind hierarchy."}
];

const DC = {"Composition":"#10b981","Data Exchange":"#3b82f6","Pipeline Development":"#8b5cf6","Data Modeling":"#f59e0b","Debugging & Troubleshooting":"#ef4444","Content Aggregation":"#06b6d4","Visualization":"#ec4899","Customizing USD":"#f97316"};
const DW = {"Composition":"23%","Data Exchange":"15%","Pipeline Development":"14%","Data Modeling":"13%","Debugging & Troubleshooting":"11%","Content Aggregation":"10%","Visualization":"8%","Customizing USD":"6%"};

function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function shuffleQ(q){const idx=q.options.map((_,i)=>i);const s=shuffle(idx);return{...q,options:s.map(i=>q.options[i]),correct:q.correct.map(c=>s.indexOf(c))};}

export default function App(){
  const[phase,setPhase]=useState("intro");
  const[cur,setCur]=useState(0);
  const[ans,setAns]=useState({});
  const[locked,setLocked]=useState({});
  const[flagged,setFlagged]=useState(new Set());
  const[timeLeft,setTimeLeft]=useState(7200);
  const[timerOn,setTimerOn]=useState(false);
  const[showNav,setShowNav]=useState(false);
  const[eqs,setEqs]=useState([]);
  const tRef=useRef(null);

  useEffect(()=>{
    if(timerOn&&timeLeft>0){
      tRef.current=setInterval(()=>{
        setTimeLeft(t=>{if(t<=1){clearInterval(tRef.current);setTimerOn(false);setPhase("results");return 0;}return t-1;});
      },1000);
    }
    return()=>clearInterval(tRef.current);
  },[timerOn]);

  const start=()=>{
    setEqs(shuffle(QUESTIONS).map(shuffleQ));
    setPhase("exam");setTimerOn(true);setCur(0);setAns({});setLocked({});setFlagged(new Set());setTimeLeft(7200);
  };
  const toggle=(qId,i)=>{if(locked[qId])return;const q=eqs.find(x=>x.id===qId);setAns(p=>{const c=p[qId]||[];if(q.type==="single")return{...p,[qId]:[i]};return c.includes(i)?{...p,[qId]:c.filter(x=>x!==i)}:{...p,[qId]:[...c,i]};});};
  const lock=(qId)=>{if(locked[qId]||!(ans[qId]&&ans[qId].length))return;setLocked(p=>({...p,[qId]:true}));};
  const submit=()=>{const a={};eqs.forEach(q=>{a[q.id]=true;});setLocked(a);setTimerOn(false);clearInterval(tRef.current);setPhase("results");};
  const fmt=s=>`${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const chk=(qId)=>{const q=eqs.find(x=>x.id===qId);if(!q)return false;const a=ans[qId]||[];return a.length===q.correct.length&&a.every(x=>q.correct.includes(x));};
  const score=()=>eqs.reduce((s,q)=>s+(chk(q.id)?1:0),0);
  const domScores=()=>{const d={};eqs.forEach(q=>{if(!d[q.domain])d[q.domain]={t:0,c:0};d[q.domain].t++;if(chk(q.id))d[q.domain].c++;});return d;};

  const S={root:{minHeight:"100vh",background:"linear-gradient(135deg,#0a0a0f 0%,#111827 50%,#0f172a 100%)",color:"#e2e8f0",fontFamily:"'JetBrains Mono','Fira Code','SF Mono',monospace"},
    card:{background:"rgba(255,255,255,0.03)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)"},
    btn:(bg,c,bc)=>({padding:"10px 20px",borderRadius:8,background:bg,color:c,border:bc||"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}),
    tag:(col)=>({padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:col+"22",color:col})};

  // INTRO
  if(phase==="intro"){
    return(<div style={{...S.root,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{maxWidth:680,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:40,background:"linear-gradient(180deg,rgba(16,185,129,0.08) 0%,transparent 100%)",borderRadius:16,padding:"48px 32px",border:"1px solid rgba(16,185,129,0.15)"}}>
          <div style={{fontSize:11,letterSpacing:4,textTransform:"uppercase",color:"#10b981",marginBottom:12,fontWeight:600}}>NVIDIA NCP-OUSD</div>
          <h1 style={{fontSize:32,fontWeight:800,margin:"0 0 8px",background:"linear-gradient(135deg,#10b981,#3b82f6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>OpenUSD Certification</h1>
          <div style={{fontSize:16,color:"#94a3b8"}}>Practice Examination</div>
        </div>
        <div style={{...S.card,padding:"28px 32px",marginBottom:24}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px 32px",fontSize:14}}>
            {[["Questions","65 multiple choice"],["Time Limit","120 minutes"],["Passing Score","70% (46 of 65)"],["Format","Single & multi-select"]].map(([l,v])=>(
              <div key={l}><div style={{color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div><div style={{color:"#e2e8f0",fontWeight:600}}>{v}</div></div>
            ))}
          </div>
        </div>
        <div style={{background:"rgba(245,158,11,0.06)",borderRadius:12,padding:"16px 24px",border:"1px solid rgba(245,158,11,0.15)",marginBottom:24,fontSize:13,color:"#fbbf24",lineHeight:1.6}}>
          ⚡ Questions and answer choices are <strong>randomized</strong> each attempt. Click <strong>Lock Answer</strong> to see instant right/wrong feedback.
        </div>
        <div style={{...S.card,padding:"20px 32px",marginBottom:32}}>
          <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:1,color:"#64748b",marginBottom:12}}>Domain Distribution</div>
          {Object.entries(DW).map(([d,w])=>(<div key={d} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:DC[d],flexShrink:0}}/><div style={{flex:1,fontSize:13,color:"#cbd5e1"}}>{d}</div><div style={{fontSize:13,color:DC[d],fontWeight:700}}>{w}</div>
          </div>))}
        </div>
        <button onClick={start} style={{width:"100%",padding:16,borderRadius:10,background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:1,textTransform:"uppercase",boxShadow:"0 4px 24px rgba(16,185,129,0.3)"}}>Begin Exam →</button>
      </div>
    </div>);
  }

  // RESULTS
  if(phase==="results"){
    const sc=score(),pct=Math.round((sc/eqs.length)*100),pass=pct>=70,ds=domScores();
    return(<div style={{...S.root,padding:24}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <div style={{textAlign:"center",padding:"48px 32px",marginBottom:32,borderRadius:16,background:pass?"linear-gradient(180deg,rgba(16,185,129,0.1) 0%,transparent 100%)":"linear-gradient(180deg,rgba(239,68,68,0.1) 0%,transparent 100%)",border:`1px solid ${pass?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"}`}}>
          <div style={{fontSize:64,fontWeight:900,marginBottom:8,background:pass?"linear-gradient(135deg,#10b981,#34d399)":"linear-gradient(135deg,#ef4444,#f87171)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{pct}%</div>
          <div style={{fontSize:20,fontWeight:700,marginBottom:8,color:pass?"#10b981":"#ef4444"}}>{pass?"PASSED":"NOT PASSED"}</div>
          <div style={{color:"#94a3b8",fontSize:14}}>{sc} of {eqs.length} correct · 70% required</div>
        </div>
        <div style={{...S.card,padding:28,marginBottom:24}}>
          <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:1,color:"#64748b",marginBottom:16}}>Score by Domain</div>
          {Object.entries(ds).map(([d,{t,c}])=>{const dp=t>0?Math.round((c/t)*100):0;return(
            <div key={d} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:"50%",background:DC[d]}}/><span style={{color:"#cbd5e1"}}>{d}</span></div>
                <span style={{color:DC[d],fontWeight:700}}>{c}/{t} ({dp}%)</span>
              </div>
              <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.06)"}}><div style={{height:"100%",borderRadius:3,width:`${dp}%`,background:DC[d],transition:"width 0.8s"}}/></div>
            </div>);})}
        </div>
        <div style={{...S.card,padding:20,marginBottom:24,maxHeight:320,overflowY:"auto"}}>
          <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:1,color:"#64748b",marginBottom:12}}>All Questions</div>
          {eqs.map((q,i)=>{const ok=chk(q.id);return(
            <button key={q.id} onClick={()=>{setCur(i);setPhase("review");}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",padding:"8px 12px",borderRadius:6,marginBottom:4,cursor:"pointer",background:"transparent",border:"none",fontFamily:"inherit",color:"#cbd5e1",fontSize:13}}
              onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
              <span style={{width:22,height:22,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:ok?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",color:ok?"#10b981":"#ef4444",border:`1px solid ${ok?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`}}>{ok?"✓":"✗"}</span>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Q{i+1}: {q.question.split('\n')[0]}</span>
              <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:DC[q.domain]+"18",color:DC[q.domain]}}>{q.domain.split(" ")[0]}</span>
            </button>);})}
        </div>
        <div style={{display:"flex",gap:12}}>
          <button onClick={()=>{setCur(0);setPhase("review");}} style={S.btn("rgba(59,130,246,0.15)","#60a5fa","1px solid rgba(59,130,246,0.3)")}>Review All</button>
          <button onClick={start} style={{...S.btn("linear-gradient(135deg,#10b981,#059669)","#fff"),flex:1}}>Retake (Randomized)</button>
        </div>
      </div>
    </div>);
  }

  // REVIEW
  if(phase==="review"){
    const q=eqs[cur],a=ans[q.id]||[],ok=chk(q.id);
    return(<div style={{...S.root,padding:20}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:8}}>
          <button onClick={()=>setPhase("results")} style={S.btn("rgba(255,255,255,0.06)","#94a3b8","1px solid rgba(255,255,255,0.1)")}>← Results</button>
          <div style={{fontSize:13,color:"#64748b"}}>Review: {cur+1}/{eqs.length}</div>
          <div style={{display:"flex",gap:8}}>
            <button disabled={cur===0} onClick={()=>setCur(c=>c-1)} style={S.btn("rgba(255,255,255,0.06)",cur===0?"#1e293b":"#94a3b8","1px solid rgba(255,255,255,0.1)")}>Prev</button>
            <button disabled={cur===eqs.length-1} onClick={()=>setCur(c=>c+1)} style={S.btn("rgba(255,255,255,0.06)",cur===eqs.length-1?"#1e293b":"#94a3b8","1px solid rgba(255,255,255,0.1)")}>Next</button>
          </div>
        </div>
        <div style={{...S.card,border:`1px solid ${ok?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`,padding:28}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <span style={S.tag(DC[q.domain])}>{q.domain}</span>
            <span style={{fontSize:12,fontWeight:700,color:ok?"#10b981":"#ef4444"}}>{ok?"✓ CORRECT":"✗ INCORRECT"}</span>
          </div>
          <div style={{fontSize:15,lineHeight:1.6,marginBottom:20,whiteSpace:"pre-wrap"}}>{q.question}</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q.options.map((o,i)=>{const sel=a.includes(i),cor=q.correct.includes(i);
              let bg="rgba(255,255,255,0.03)",bd="1px solid rgba(255,255,255,0.08)";
              if(cor){bg="rgba(16,185,129,0.1)";bd="1px solid rgba(16,185,129,0.4)";}
              else if(sel){bg="rgba(239,68,68,0.1)";bd="1px solid rgba(239,68,68,0.4)";}
              return(<div key={i} style={{padding:"12px 16px",borderRadius:8,background:bg,border:bd,display:"flex",alignItems:"flex-start",gap:12,fontSize:14}}>
                <span style={{width:22,height:22,borderRadius:q.type==="single"?"50%":4,border:`2px solid ${cor?"#10b981":sel?"#ef4444":"#374151"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,marginTop:1,background:cor?"rgba(16,185,129,0.2)":sel?"rgba(239,68,68,0.2)":"transparent",color:cor?"#10b981":"#ef4444"}}>{cor?"✓":sel?"✗":""}</span>
                <span>{o}</span>
              </div>);})}
          </div>
          <div style={{marginTop:20,padding:"14px 18px",borderRadius:8,background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",fontSize:13,lineHeight:1.6,color:"#93c5fd"}}>
            <span style={{fontWeight:700,color:"#60a5fa"}}>Explanation: </span>{q.explanation}
          </div>
        </div>
      </div>
    </div>);
  }

  // EXAM
  const q=eqs[cur];if(!q)return null;
  const a=ans[q.id]||[],il=!!locked[q.id],qc=il?chk(q.id):null,lc=Object.keys(locked).length,tw=timeLeft<600;

  return(<div style={{...S.root,display:"flex",flexDirection:"column"}}>
    <div style={{padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(0,0,0,0.3)",position:"sticky",top:0,zIndex:10,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <span style={{fontSize:11,color:"#10b981",fontWeight:600,letterSpacing:2,textTransform:"uppercase"}}>NCP-OUSD</span>
        <span style={{color:"#475569",fontSize:12}}>{lc}/{eqs.length} locked</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:18,fontWeight:700,fontVariantNumeric:"tabular-nums",color:tw?"#ef4444":"#e2e8f0",animation:tw?"pulse 1s infinite":"none"}}>{fmt(timeLeft)}</div>
        <button onClick={()=>setShowNav(!showNav)} style={S.btn("rgba(255,255,255,0.06)","#94a3b8","1px solid rgba(255,255,255,0.1)")}>{showNav?"Hide":"Nav"}</button>
        <button onClick={()=>{if(window.confirm(`Submit? ${lc}/${eqs.length} locked.`))submit();}} style={{...S.btn("rgba(239,68,68,0.15)","#f87171","1px solid rgba(239,68,68,0.3)"),fontWeight:600}}>Submit</button>
      </div>
    </div>
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      {showNav&&(<div style={{width:260,padding:16,borderRight:"1px solid rgba(255,255,255,0.06)",overflowY:"auto",background:"rgba(0,0,0,0.2)",flexShrink:0}}>
        <div style={{fontSize:11,color:"#64748b",marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>Questions</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
          {eqs.map((x,i)=>{const xl=!!locked[x.id],xc=xl?chk(x.id):null,ha=!!(ans[x.id]&&ans[x.id].length),ic=i===cur;
            let bg="rgba(255,255,255,0.03)",col="#64748b";
            if(xl&&xc){bg="rgba(16,185,129,0.2)";col="#10b981";}
            else if(xl&&!xc){bg="rgba(239,68,68,0.2)";col="#ef4444";}
            else if(ha){bg="rgba(245,158,11,0.12)";col="#fbbf24";}
            return(<button key={x.id} onClick={()=>setCur(i)} style={{width:"100%",aspectRatio:"1",borderRadius:6,fontSize:11,fontWeight:600,border:ic?"2px solid #10b981":"1px solid rgba(255,255,255,0.08)",background:bg,color:col,cursor:"pointer",fontFamily:"inherit",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {i+1}{flagged.has(x.id)&&<span style={{position:"absolute",top:2,right:3,fontSize:8,color:"#f59e0b"}}>⚑</span>}
            </button>);})}
        </div>
        <div style={{marginTop:16,fontSize:11,color:"#475569"}}>
          {[["rgba(16,185,129,0.2)","Correct"],["rgba(239,68,68,0.2)","Wrong"],["rgba(245,158,11,0.12)","Selected"],["rgba(255,255,255,0.03)","Unanswered"]].map(([c,l])=>
            <div key={l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{width:10,height:10,borderRadius:3,background:c,border:l==="Unanswered"?"1px solid rgba(255,255,255,0.08)":"none"}}/>{l}</div>)}
        </div>
      </div>)}
      <div style={{flex:1,padding:"28px 24px",overflowY:"auto",maxWidth:800,margin:"0 auto",width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
          <span style={S.tag(DC[q.domain])}>{q.domain}</span>
          <span style={{color:"#64748b",fontSize:12}}>Question {cur+1} of {eqs.length}</span>
          {il&&<span style={{fontSize:12,fontWeight:700,padding:"2px 10px",borderRadius:6,background:qc?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)",color:qc?"#10b981":"#ef4444"}}>{qc?"✓ Correct":"✗ Wrong"}</span>}
          <button onClick={()=>{setFlagged(p=>{const n=new Set(p);n.has(q.id)?n.delete(q.id):n.add(q.id);return n;});}} style={{marginLeft:"auto",background:"none",border:"none",color:flagged.has(q.id)?"#f59e0b":"#374151",cursor:"pointer",fontSize:18,padding:4}} title="Flag">⚑</button>
        </div>
        <div style={{fontSize:15,lineHeight:1.7,marginBottom:24,whiteSpace:"pre-wrap"}}>{q.question}</div>
        {q.type==="multi"&&<div style={{fontSize:11,color:"#f59e0b",marginBottom:14,textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>⬡ Select all that apply</div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {q.options.map((o,i)=>{const sel=a.includes(i),cor=q.correct.includes(i);
            let bg,bd,rc;
            if(il){
              if(cor){bg="rgba(16,185,129,0.1)";bd="1px solid rgba(16,185,129,0.4)";rc="#10b981";}
              else if(sel){bg="rgba(239,68,68,0.1)";bd="1px solid rgba(239,68,68,0.4)";rc="#ef4444";}
              else{bg="rgba(255,255,255,0.02)";bd="1px solid rgba(255,255,255,0.05)";rc="#374151";}
            }else{bg=sel?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.03)";bd=sel?"1px solid rgba(16,185,129,0.4)":"1px solid rgba(255,255,255,0.08)";rc=sel?"#10b981":"#374151";}
            return(<button key={i} onClick={()=>toggle(q.id,i)} disabled={il} style={{textAlign:"left",padding:"14px 18px",borderRadius:10,background:bg,border:bd,color:"#e2e8f0",cursor:il?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"flex-start",gap:14,fontSize:14,transition:"all 0.15s",opacity:il&&!cor&&!sel?0.5:1}}>
              <span style={{width:22,height:22,borderRadius:q.type==="single"?"50%":4,border:`2px solid ${rc}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,background:il?(cor?"rgba(16,185,129,0.2)":sel?"rgba(239,68,68,0.2)":"transparent"):(sel?"#10b981":"transparent")}}>
                {il&&cor&&<span style={{color:"#10b981",fontSize:12,fontWeight:900}}>✓</span>}
                {il&&sel&&!cor&&<span style={{color:"#ef4444",fontSize:12,fontWeight:900}}>✗</span>}
                {!il&&sel&&<span style={{color:"#fff",fontSize:12,fontWeight:900}}>✓</span>}
              </span><span>{o}</span>
            </button>);})}
        </div>
        {!il&&<button onClick={()=>lock(q.id)} disabled={a.length===0} style={{marginTop:20,padding:"12px 28px",borderRadius:8,background:a.length===0?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#f59e0b,#d97706)",color:a.length===0?"#374151":"#fff",border:"none",fontSize:14,fontWeight:700,cursor:a.length===0?"default":"pointer",fontFamily:"inherit"}}>Lock Answer</button>}
        {il&&<div style={{marginTop:20,padding:"14px 18px",borderRadius:8,background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",fontSize:13,lineHeight:1.6,color:"#93c5fd",animation:"fadeIn 0.3s ease"}}>
          <span style={{fontWeight:700,color:"#60a5fa"}}>Explanation: </span>{q.explanation}
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:28,paddingBottom:24}}>
          <button disabled={cur===0} onClick={()=>setCur(c=>c-1)} style={S.btn("rgba(255,255,255,0.06)",cur===0?"#1e293b":"#94a3b8","1px solid rgba(255,255,255,0.1)")}>← Previous</button>
          {cur<eqs.length-1?
            <button onClick={()=>setCur(c=>c+1)} style={S.btn("rgba(16,185,129,0.15)","#10b981","1px solid rgba(16,185,129,0.3)")}>Next →</button>:
            <button onClick={()=>{if(window.confirm(`Submit? ${lc}/${eqs.length} locked.`))submit();}} style={{padding:"10px 24px",borderRadius:8,background:"linear-gradient(135deg,#10b981,#059669)",border:"none",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700}}>Submit Exam</button>}
        </div>
      </div>
    </div>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}`}</style>
  </div>);
}
