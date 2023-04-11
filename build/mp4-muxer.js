"use strict";
var Mp4Muxer = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __pow = Math.pow;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b ||= {})
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __accessCheck = (obj, member, msg) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg);
  };
  var __privateGet = (obj, member, getter) => {
    __accessCheck(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
  };
  var __privateAdd = (obj, member, value) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  };
  var __privateSet = (obj, member, value, setter) => {
    __accessCheck(obj, member, "write to private field");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
  };
  var __privateMethod = (obj, member, method) => {
    __accessCheck(obj, member, "access private method");
    return method;
  };

  // src/main.ts
  var main_exports = {};
  __export(main_exports, {
    GLOBAL_TIMESCALE: () => GLOBAL_TIMESCALE,
    default: () => main_default
  });

  // src/misc.ts
  var u16 = (value) => {
    let bytes = new Uint8Array(2);
    let view = new DataView(bytes.buffer);
    view.setUint16(0, value, false);
    return [...bytes];
  };
  var i16 = (value) => {
    let bytes = new Uint8Array(2);
    let view = new DataView(bytes.buffer);
    view.setInt16(0, value, false);
    return [...bytes];
  };
  var u24 = (value) => {
    let bytes = new Uint8Array(4);
    let view = new DataView(bytes.buffer);
    view.setUint32(0, value, false);
    return [...bytes].slice(1);
  };
  var u32 = (value) => {
    let bytes = new Uint8Array(4);
    let view = new DataView(bytes.buffer);
    view.setUint32(0, value, false);
    return [...bytes];
  };
  var fixed16 = (value) => {
    let bytes = new Uint8Array(2);
    let view = new DataView(bytes.buffer);
    view.setUint8(0, value);
    view.setUint8(1, value << 8);
    return [...bytes];
  };
  var fixed32 = (value) => {
    let bytes = new Uint8Array(4);
    let view = new DataView(bytes.buffer);
    view.setUint16(0, value, false);
    view.setUint16(2, value << 16, false);
    return [...bytes];
  };
  var ascii = (text, nullTerminated = false) => {
    let bytes = Array(text.length).fill(null).map((_, i) => text.charCodeAt(i));
    if (nullTerminated)
      bytes.push(0);
    return bytes;
  };
  var timestampToUnits = (timestamp, timescale) => {
    return Math.round(timestamp * timescale);
  };
  var last = (arr) => {
    return arr && arr[arr.length - 1];
  };

  // src/boxes.ts
  var IDENTITY_MATRIX = [
    65536,
    0,
    0,
    0,
    65536,
    0,
    0,
    0,
    1073741824
  ].map(u32);
  var box = (type, contents, children) => ({
    type,
    contents: contents && new Uint8Array(contents.flat(10)),
    children
  });
  var fullBox = (type, version, flags, contents, children) => box(
    type,
    [version, u24(flags), contents != null ? contents : []],
    children
  );
  var ftyp = () => box("ftyp", [
    ascii("isom"),
    // Major brand
    u32(0),
    // Minor version
    ascii("isom"),
    // Compatible brand 1
    ascii("avc1"),
    // Compatible brand 2
    ascii("mp41")
    // Compatible brand 3
  ]);
  var mdat = () => ({ type: "mdat", largeSize: true });
  var moov = (tracks, creationTime) => box("moov", null, [
    mvhd(creationTime, tracks),
    ...tracks.map((x) => trak(x, creationTime))
  ]);
  var mvhd = (creationTime, tracks) => {
    let duration = timestampToUnits(Math.max(
      ...tracks.map((x) => last(x.samples).timestamp + last(x.samples).duration)
    ), GLOBAL_TIMESCALE);
    let nextTrackId = Math.max(...tracks.map((x) => x.id)) + 1;
    return fullBox("mvhd", 0, 0, [
      u32(creationTime),
      // Creation time
      u32(creationTime),
      // Modification time
      u32(GLOBAL_TIMESCALE),
      // Timescale
      u32(duration),
      // Duration
      fixed32(1),
      // Preferred rate
      fixed16(1),
      // Preferred volume
      Array(10).fill(0),
      // Reserved
      IDENTITY_MATRIX,
      // Matrix
      Array(24).fill(0),
      // Pre-defined
      u32(nextTrackId)
      // Next track ID
    ]);
  };
  var trak = (track, creationTime) => box("trak", null, [
    tkhd(track, creationTime),
    mdia(track, creationTime)
  ]);
  var tkhd = (track, creationTime) => {
    let lastSample = last(track.samples);
    let durationInGlobalTimescale = timestampToUnits(
      lastSample.timestamp + lastSample.duration,
      GLOBAL_TIMESCALE
    );
    return fullBox("tkhd", 0, 3, [
      u32(creationTime),
      // Creation time
      u32(creationTime),
      // Modification time
      u32(track.id),
      // Track ID
      u32(0),
      // Reserved
      u32(durationInGlobalTimescale),
      // Duration
      Array(8).fill(0),
      // Reserved
      0,
      0,
      // Layer
      0,
      0,
      // Alternate group
      fixed16(track.info.type === "audio" ? 1 : 0),
      // Volume
      0,
      0,
      // Reserved
      IDENTITY_MATRIX,
      // Matrix
      fixed32(track.info.type === "video" ? track.info.width : 0),
      // Track width
      fixed32(track.info.type === "video" ? track.info.height : 0)
      // Track height
    ]);
  };
  var mdia = (track, creationTime) => box("mdia", null, [
    mdhd(track, creationTime),
    hdlr(track.info.type === "video" ? "vide" : "soun"),
    minf(track)
  ]);
  var mdhd = (track, creationTime) => {
    let lastSample = last(track.samples);
    let localDuration = timestampToUnits(
      lastSample.timestamp + lastSample.duration,
      track.timescale
    );
    return fullBox("mdhd", 0, 0, [
      u32(creationTime),
      // Creation time
      u32(creationTime),
      // Modification time
      u32(track.timescale),
      // Timescale
      u32(localDuration),
      // Duration
      85,
      196,
      // Language ("und", undetermined)
      u16(0)
      // Quality
    ]);
  };
  var hdlr = (componentSubtype) => fullBox("hdlr", 0, 0, [
    ascii("mhlr"),
    // Component type
    ascii(componentSubtype),
    // Component subtype
    u32(0),
    // Component manufacturer
    u32(0),
    // Component flags
    u32(0),
    // Component flags mask
    ascii("mp4-muxer-hdlr")
    // Component name
  ]);
  var minf = (track) => box("minf", null, [
    track.info.type === "video" ? vmhd() : smhd(),
    dinf(),
    stbl(track)
  ]);
  var vmhd = () => fullBox("vmhd", 0, 1, [
    u16(0),
    // Graphics mode
    u16(0),
    // Opcolor R
    u16(0),
    // Opcolor G
    u16(0)
    // Opcolor B
  ]);
  var smhd = () => fullBox("smhd", 0, 0, [
    0,
    0,
    // Balance
    0,
    0
    // Reserved
  ]);
  var dinf = () => box("dinf", null, [
    dref()
  ]);
  var dref = () => fullBox("dref", 0, 0, [
    u32(1)
    // Entry count
  ], [
    url()
  ]);
  var url = () => fullBox("url ", 0, 1);
  var stbl = (track) => box("stbl", null, [
    stsd(track),
    stts(track),
    stss(track),
    stsc(track),
    stsz(track),
    stco(track)
  ]);
  var stsd = (track) => fullBox("stsd", 0, 0, [
    u32(1)
    // Entry count
  ], [
    track.info.type === "video" ? avc1(track) : mp4a(track)
  ]);
  var avc1 = (track) => box("avc1", [
    Array(6).fill(0),
    // Reserved
    0,
    1,
    // Data reference index
    0,
    0,
    // Pre-defined
    0,
    0,
    // Reserved
    Array(12).fill(0),
    // Pre-defined
    u16(track.info.width),
    // Width
    u16(track.info.height),
    // Height
    u32(4718592),
    // Horizontal resolution
    u32(4718592),
    // Vertical resolution
    u32(0),
    // Reserved
    u16(1),
    // Frame count
    Array(32).fill(0),
    // Compressor name
    u16(24),
    // Depth
    i16(65535)
    // Pre-defined
  ], [
    avcC(track)
  ]);
  var avcC = (track) => box("avcC", [...track.codecPrivate]);
  var mp4a = (track) => box("mp4a", [
    Array(6).fill(0),
    // Reserved
    u16(1),
    // Data reference index
    u16(0),
    // Version
    u16(0),
    // Revision level
    u32(0),
    // Vendor
    u16(track.info.numberOfChannels),
    // Number of channels
    u16(track.info.bitDepth),
    // Sample size (bits)
    u16(0),
    // Compression ID
    u16(0),
    // Packet size
    fixed32(track.info.sampleRate)
    // Sample rate
  ], [
    esds(track)
  ]);
  var esds = (track) => fullBox("esds", 0, 0, [
    // https://stackoverflow.com/a/54803118
    u32(58753152),
    // TAG(3) = Object Descriptor ([2])
    34,
    // length of this OD (which includes the next 2 tags)
    u16(1),
    // ES_ID = 1
    0,
    // flags etc = 0
    u32(75530368),
    // TAG(4) = ES Descriptor ([2]) embedded in above OD
    20,
    // length of this ESD
    64,
    // MPEG-4 Audio
    21,
    // stream type(6bits)=5 audio, flags(2bits)=1
    0,
    0,
    0,
    // 24bit buffer size
    u32(130071),
    // max bitrate
    u32(130071),
    // avg bitrate
    u32(92307584),
    // TAG(5) = ASC ([2],[3]) embedded in above OD
    2,
    // length
    track.codecPrivate[0],
    track.codecPrivate[1],
    u32(109084800),
    // TAG(6)
    1,
    // length
    2
    // data
  ]);
  var stts = (track) => {
    var _a, _b;
    let current = [];
    let entries = [];
    for (let sample of track.samples) {
      current.push(sample);
      if (current.length === 1)
        continue;
      let referenceDelta = timestampToUnits(current[1].timestamp - current[0].timestamp, track.timescale);
      let newDelta = timestampToUnits(sample.timestamp - current[current.length - 2].timestamp, track.timescale);
      if (newDelta !== referenceDelta) {
        entries.push({ sampleCount: current.length - 1, sampleDelta: referenceDelta });
        current = current.slice(-2);
      }
    }
    entries.push({
      sampleCount: current.length,
      sampleDelta: timestampToUnits(((_b = (_a = current[1]) == null ? void 0 : _a.timestamp) != null ? _b : current[0].timestamp) - current[0].timestamp, track.timescale)
    });
    return fullBox("stts", 0, 0, [
      u32(entries.length),
      // Number of entries
      entries.map((x) => [u32(x.sampleCount), u32(x.sampleDelta)])
      // Time-to-sample table
    ]);
  };
  var stss = (track) => {
    if (track.samples.every((x) => x.type === "key"))
      return null;
    let keySamples = [...track.samples.entries()].filter(([, sample]) => sample.type === "key");
    return fullBox("stss", 0, 0, [
      u32(keySamples.length),
      // Number of entries
      keySamples.map(([index]) => u32(index + 1))
      // Sync sample table
    ]);
  };
  var stsc = (track) => {
    let compactlyCodedChunks = [];
    for (let i = 0; i < track.writtenChunks.length; i++) {
      let next = track.writtenChunks[i];
      if (compactlyCodedChunks.length === 0 || last(compactlyCodedChunks).samplesPerChunk !== next.sampleCount) {
        compactlyCodedChunks.push({ firstChunk: i + 1, samplesPerChunk: next.sampleCount });
      }
    }
    return fullBox("stsc", 0, 0, [
      u32(compactlyCodedChunks.length),
      // Number of entries
      compactlyCodedChunks.map((x) => [
        // Sample-to-chunk table
        u32(x.firstChunk),
        // First chunk
        u32(x.samplesPerChunk),
        // Samples per chunk
        u32(1)
        // Sample description index
      ])
    ]);
  };
  var stsz = (track) => fullBox("stsz", 0, 0, [
    u32(0),
    // Sample size (0 means non-constant size)
    u32(track.samples.length),
    // Number of entries
    track.samples.map((x) => u32(x.size))
    // Sample size table
  ]);
  var stco = (track) => fullBox("stco", 0, 0, [
    u32(track.writtenChunks.length),
    // Number of entries
    track.writtenChunks.map((x) => u32(x.offset))
    // Chunk offset table
  ]);

  // src/write_target.ts
  var _helper, _helperView;
  var WriteTarget = class {
    constructor() {
      this.pos = 0;
      __privateAdd(this, _helper, new Uint8Array(8));
      __privateAdd(this, _helperView, new DataView(__privateGet(this, _helper).buffer));
      /**
       * Stores the position from the start of the file to where boxes elements have been written. This is used to
       * rewrite/edit elements that were already added before, and to measure sizes of things.
       */
      this.offsets = /* @__PURE__ */ new WeakMap();
    }
    writeU32(value) {
      __privateGet(this, _helperView).setUint32(0, value, false);
      this.write(__privateGet(this, _helper).subarray(0, 4));
    }
    writeU64(value) {
      __privateGet(this, _helperView).setUint32(0, Math.floor(value / __pow(2, 32)), false);
      __privateGet(this, _helperView).setUint32(4, value, false);
      this.write(__privateGet(this, _helper).subarray(0, 8));
    }
    writeAscii(text) {
      for (let i = 0; i < text.length; i++) {
        __privateGet(this, _helperView).setUint8(i % 8, text.charCodeAt(i));
        if (i % 8 === 7)
          this.write(__privateGet(this, _helper));
      }
      if (text.length % 8 !== 0) {
        this.write(__privateGet(this, _helper).subarray(0, text.length % 8));
      }
    }
    writeBox(box2) {
      var _a, _b;
      this.offsets.set(box2, this.pos);
      if (box2.contents && !box2.children) {
        this.writeBoxHeader(box2, (_a = box2.size) != null ? _a : box2.contents.byteLength + 8);
        this.write(box2.contents);
      } else {
        let startPos = this.pos;
        this.writeBoxHeader(box2, 0);
        if (box2.contents)
          this.write(box2.contents);
        if (box2.children) {
          for (let child of box2.children)
            if (child)
              this.writeBox(child);
        }
        let endPos = this.pos;
        let size = (_b = box2.size) != null ? _b : endPos - startPos;
        this.pos = startPos;
        this.writeBoxHeader(box2, size);
        this.pos = endPos;
      }
    }
    writeBoxHeader(box2, size) {
      this.writeU32(box2.largeSize ? 1 : size);
      this.writeAscii(box2.type);
      if (box2.largeSize)
        this.writeU64(size);
    }
    patchBox(box2) {
      let endPos = this.pos;
      this.pos = this.offsets.get(box2);
      this.writeBox(box2);
      this.pos = endPos;
    }
  };
  _helper = new WeakMap();
  _helperView = new WeakMap();
  var _buffer, _bytes;
  var ArrayBufferWriteTarget = class extends WriteTarget {
    constructor() {
      super();
      __privateAdd(this, _buffer, new ArrayBuffer(__pow(2, 16)));
      __privateAdd(this, _bytes, new Uint8Array(__privateGet(this, _buffer)));
    }
    ensureSize(size) {
      let newLength = __privateGet(this, _buffer).byteLength;
      while (newLength < size)
        newLength *= 2;
      if (newLength === __privateGet(this, _buffer).byteLength)
        return;
      let newBuffer = new ArrayBuffer(newLength);
      let newBytes = new Uint8Array(newBuffer);
      newBytes.set(__privateGet(this, _bytes), 0);
      __privateSet(this, _buffer, newBuffer);
      __privateSet(this, _bytes, newBytes);
    }
    write(data) {
      this.ensureSize(this.pos + data.byteLength);
      __privateGet(this, _bytes).set(data, this.pos);
      this.pos += data.byteLength;
    }
    seek(newPos) {
      this.pos = newPos;
    }
    finalize() {
      this.ensureSize(this.pos);
      return __privateGet(this, _buffer).slice(0, this.pos);
    }
  };
  _buffer = new WeakMap();
  _bytes = new WeakMap();
  var FILE_CHUNK_SIZE = __pow(2, 24);
  var MAX_CHUNKS_AT_ONCE = 2;
  var _stream, _chunks;
  var FileSystemWritableFileStreamWriteTarget = class extends WriteTarget {
    constructor(stream) {
      super();
      __privateAdd(this, _stream, void 0);
      /**
       * The file is divided up into fixed-size chunks, whose contents are first filled in RAM and then flushed to disk.
       * A chunk is flushed to disk if all of its contents have been written.
       */
      __privateAdd(this, _chunks, []);
      __privateSet(this, _stream, stream);
    }
    write(data) {
      this.writeDataIntoChunks(data, this.pos);
      this.flushChunks();
      this.pos += data.byteLength;
    }
    writeDataIntoChunks(data, position) {
      let chunkIndex = __privateGet(this, _chunks).findIndex((x) => x.start <= position && position < x.start + FILE_CHUNK_SIZE);
      if (chunkIndex === -1)
        chunkIndex = this.createChunk(position);
      let chunk = __privateGet(this, _chunks)[chunkIndex];
      let relativePosition = position - chunk.start;
      let toWrite = data.subarray(0, Math.min(FILE_CHUNK_SIZE - relativePosition, data.byteLength));
      chunk.data.set(toWrite, relativePosition);
      let section = {
        start: relativePosition,
        end: relativePosition + toWrite.byteLength
      };
      insertSectionIntoFileChunk(chunk, section);
      if (chunk.written[0].start === 0 && chunk.written[0].end === FILE_CHUNK_SIZE) {
        chunk.shouldFlush = true;
      }
      if (__privateGet(this, _chunks).length > MAX_CHUNKS_AT_ONCE) {
        for (let i = 0; i < __privateGet(this, _chunks).length - 1; i++) {
          __privateGet(this, _chunks)[i].shouldFlush = true;
        }
        this.flushChunks();
      }
      if (toWrite.byteLength < data.byteLength) {
        this.writeDataIntoChunks(data.subarray(toWrite.byteLength), position + toWrite.byteLength);
      }
    }
    createChunk(includesPosition) {
      let start = Math.floor(includesPosition / FILE_CHUNK_SIZE) * FILE_CHUNK_SIZE;
      let chunk = {
        start,
        data: new Uint8Array(FILE_CHUNK_SIZE),
        written: [],
        shouldFlush: false
      };
      __privateGet(this, _chunks).push(chunk);
      __privateGet(this, _chunks).sort((a, b) => a.start - b.start);
      return __privateGet(this, _chunks).indexOf(chunk);
    }
    flushChunks(force = false) {
      for (let i = 0; i < __privateGet(this, _chunks).length; i++) {
        let chunk = __privateGet(this, _chunks)[i];
        if (!chunk.shouldFlush && !force)
          continue;
        for (let section of chunk.written) {
          __privateGet(this, _stream).write({
            type: "write",
            data: chunk.data.subarray(section.start, section.end),
            position: chunk.start + section.start
          });
        }
        __privateGet(this, _chunks).splice(i--, 1);
      }
    }
    seek(newPos) {
      this.pos = newPos;
    }
    finalize() {
      this.flushChunks(true);
    }
  };
  _stream = new WeakMap();
  _chunks = new WeakMap();
  var insertSectionIntoFileChunk = (chunk, section) => {
    let low = 0;
    let high = chunk.written.length - 1;
    let index = -1;
    while (low <= high) {
      let mid = Math.floor(low + (high - low + 1) / 2);
      if (chunk.written[mid].start <= section.start) {
        low = mid + 1;
        index = mid;
      } else {
        high = mid - 1;
      }
    }
    chunk.written.splice(index + 1, 0, section);
    if (index === -1 || chunk.written[index].end < section.start)
      index++;
    while (index < chunk.written.length - 1 && chunk.written[index].end >= chunk.written[index + 1].start) {
      chunk.written[index].end = Math.max(chunk.written[index].end, chunk.written[index + 1].end);
      chunk.written.splice(index + 1, 1);
    }
  };
  var _sections, _onFlush;
  var StreamingWriteTarget = class extends WriteTarget {
    constructor(onFlush) {
      super();
      __privateAdd(this, _sections, []);
      __privateAdd(this, _onFlush, void 0);
      __privateSet(this, _onFlush, onFlush);
    }
    write(data) {
      __privateGet(this, _sections).push({
        data: data.slice(),
        start: this.pos
      });
      this.pos += data.byteLength;
    }
    seek(newPos) {
      this.pos = newPos;
    }
    flush(done) {
      if (__privateGet(this, _sections).length === 0)
        return;
      let chunks = [];
      let sorted = [...__privateGet(this, _sections)].sort((a, b) => a.start - b.start);
      chunks.push({
        start: sorted[0].start,
        size: sorted[0].data.byteLength
      });
      for (let i = 1; i < sorted.length; i++) {
        let lastChunk = chunks[chunks.length - 1];
        let section = sorted[i];
        if (section.start <= lastChunk.start + lastChunk.size) {
          lastChunk.size = Math.max(lastChunk.size, section.start + section.data.byteLength - lastChunk.start);
        } else {
          chunks.push({
            start: section.start,
            size: section.data.byteLength
          });
        }
      }
      for (let chunk of chunks) {
        chunk.data = new Uint8Array(chunk.size);
        for (let section of __privateGet(this, _sections)) {
          if (chunk.start <= section.start && section.start < chunk.start + chunk.size) {
            chunk.data.set(section.data, section.start - chunk.start);
          }
        }
        let isLastFlush = done && chunk === chunks[chunks.length - 1];
        __privateGet(this, _onFlush).call(this, chunk.data, chunk.start, isLastFlush);
      }
      __privateGet(this, _sections).length = 0;
    }
  };
  _sections = new WeakMap();
  _onFlush = new WeakMap();

  // src/main.ts
  var TIMESTAMP_OFFSET = 2082848400;
  var MAX_CHUNK_LENGTH = 5e5;
  var FIRST_TIMESTAMP_BEHAVIORS = ["strict", "offset", "permissive"];
  var GLOBAL_TIMESCALE = 1e3;
  var _options, _target, _mdat, _videoTrack, _audioTrack, _creationTime, _finalized, _validateOptions, validateOptions_fn, _writeHeader, writeHeader_fn, _prepareTracks, prepareTracks_fn, _addSampleToTrack, addSampleToTrack_fn, _writeCurrentChunk, writeCurrentChunk_fn, _ensureNotFinalized, ensureNotFinalized_fn;
  var Mp4Muxer = class {
    constructor(options) {
      __privateAdd(this, _validateOptions);
      __privateAdd(this, _writeHeader);
      __privateAdd(this, _prepareTracks);
      __privateAdd(this, _addSampleToTrack);
      __privateAdd(this, _writeCurrentChunk);
      __privateAdd(this, _ensureNotFinalized);
      __privateAdd(this, _options, void 0);
      __privateAdd(this, _target, void 0);
      __privateAdd(this, _mdat, void 0);
      __privateAdd(this, _videoTrack, null);
      __privateAdd(this, _audioTrack, null);
      __privateAdd(this, _creationTime, Math.floor(Date.now() / 1e3) + TIMESTAMP_OFFSET);
      __privateAdd(this, _finalized, false);
      __privateMethod(this, _validateOptions, validateOptions_fn).call(this, options);
      __privateSet(this, _options, __spreadValues({
        firstTimestampBehavior: "strict"
      }, options));
      if (options.target === "buffer") {
        __privateSet(this, _target, new ArrayBufferWriteTarget());
      } else if (options.target instanceof FileSystemWritableFileStream) {
        __privateSet(this, _target, new FileSystemWritableFileStreamWriteTarget(options.target));
      } else if (typeof options.target === "function") {
        __privateSet(this, _target, new StreamingWriteTarget(options.target));
      } else {
        throw new Error(`Invalid target: ${options.target}`);
      }
      __privateMethod(this, _writeHeader, writeHeader_fn).call(this);
      __privateMethod(this, _prepareTracks, prepareTracks_fn).call(this);
    }
    addVideoChunk(sample, meta) {
      __privateMethod(this, _ensureNotFinalized, ensureNotFinalized_fn).call(this);
      if (!__privateGet(this, _options).video)
        throw new Error("No video track declared.");
      __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _videoTrack), sample, meta);
    }
    addAudioChunk(sample, meta) {
      __privateMethod(this, _ensureNotFinalized, ensureNotFinalized_fn).call(this);
      if (!__privateGet(this, _options).audio)
        throw new Error("No audio track declared.");
      __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _audioTrack), sample, meta);
    }
    finalize() {
      if (__privateGet(this, _videoTrack))
        __privateMethod(this, _writeCurrentChunk, writeCurrentChunk_fn).call(this, __privateGet(this, _videoTrack));
      if (__privateGet(this, _audioTrack))
        __privateMethod(this, _writeCurrentChunk, writeCurrentChunk_fn).call(this, __privateGet(this, _audioTrack));
      let mdatPos = __privateGet(this, _target).offsets.get(__privateGet(this, _mdat));
      let mdatSize = __privateGet(this, _target).pos - mdatPos;
      __privateGet(this, _mdat).size = mdatSize;
      __privateGet(this, _target).patchBox(__privateGet(this, _mdat));
      let movieBox = moov([__privateGet(this, _videoTrack), __privateGet(this, _audioTrack)].filter(Boolean), __privateGet(this, _creationTime));
      __privateGet(this, _target).writeBox(movieBox);
      let buffer = __privateGet(this, _target).finalize();
      return buffer;
    }
  };
  _options = new WeakMap();
  _target = new WeakMap();
  _mdat = new WeakMap();
  _videoTrack = new WeakMap();
  _audioTrack = new WeakMap();
  _creationTime = new WeakMap();
  _finalized = new WeakMap();
  _validateOptions = new WeakSet();
  validateOptions_fn = function(options) {
    if (options.firstTimestampBehavior && !FIRST_TIMESTAMP_BEHAVIORS.includes(options.firstTimestampBehavior)) {
      throw new Error(`Invalid first timestamp behavior: ${options.firstTimestampBehavior}`);
    }
  };
  _writeHeader = new WeakSet();
  writeHeader_fn = function() {
    __privateGet(this, _target).writeBox(ftyp());
    __privateSet(this, _mdat, mdat());
    __privateGet(this, _target).writeBox(__privateGet(this, _mdat));
  };
  _prepareTracks = new WeakSet();
  prepareTracks_fn = function() {
    var _a;
    if (__privateGet(this, _options).video) {
      __privateSet(this, _videoTrack, {
        id: 1,
        info: {
          type: "video",
          width: __privateGet(this, _options).video.width,
          height: __privateGet(this, _options).video.height
        },
        timescale: 720,
        // = lcm(24, 30, 60, 120, 144, 240, 360), so should fit with many framerates
        codecPrivate: null,
        samples: [],
        writtenChunks: [],
        currentChunk: null
      });
    }
    if (__privateGet(this, _options).audio) {
      __privateSet(this, _audioTrack, {
        id: __privateGet(this, _options).video ? 2 : 1,
        info: {
          type: "audio",
          numberOfChannels: __privateGet(this, _options).audio.numberOfChannels,
          sampleRate: __privateGet(this, _options).audio.sampleRate,
          bitDepth: (_a = __privateGet(this, _options).audio.bitDepth) != null ? _a : 16
        },
        timescale: __privateGet(this, _options).audio.sampleRate,
        codecPrivate: null,
        samples: [],
        writtenChunks: [],
        currentChunk: null
      });
    }
  };
  _addSampleToTrack = new WeakSet();
  addSampleToTrack_fn = function(track, sample, meta) {
    var _a;
    if (!track.currentChunk || sample.timestamp - track.currentChunk.startTimestamp >= MAX_CHUNK_LENGTH) {
      if (track.currentChunk)
        __privateMethod(this, _writeCurrentChunk, writeCurrentChunk_fn).call(this, track);
      track.currentChunk = { startTimestamp: sample.timestamp, sampleData: [], sampleCount: 0 };
    }
    let data = new Uint8Array(sample.byteLength);
    sample.copyTo(data);
    track.currentChunk.sampleData.push(data);
    track.currentChunk.sampleCount++;
    if ((_a = meta.decoderConfig) == null ? void 0 : _a.description) {
      track.codecPrivate = new Uint8Array(meta.decoderConfig.description);
    }
    track.samples.push({
      timestamp: sample.timestamp / 1e6,
      duration: sample.duration / 1e6,
      size: data.byteLength,
      type: sample.type
    });
  };
  _writeCurrentChunk = new WeakSet();
  writeCurrentChunk_fn = function(track) {
    if (!track.currentChunk)
      return;
    track.currentChunk.offset = __privateGet(this, _target).pos;
    for (let bytes of track.currentChunk.sampleData)
      __privateGet(this, _target).write(bytes);
    track.currentChunk.sampleData = null;
    track.writtenChunks.push(track.currentChunk);
  };
  _ensureNotFinalized = new WeakSet();
  ensureNotFinalized_fn = function() {
    if (__privateGet(this, _finalized)) {
      throw new Error("Cannot add new video or audio chunks after the file has been finalized.");
    }
  };
  var main_default = Mp4Muxer;
  return __toCommonJS(main_exports);
})();
Mp4Muxer = Mp4Muxer.default;
if (typeof module === "object" && typeof module.exports === "object") module.exports = Mp4Muxer;
