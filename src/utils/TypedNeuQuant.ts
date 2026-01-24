/* NeuQuant Neural-Net Quantization Algorithm
 * ------------------------------------------
 *
 * Copyright (c) 1994 Anthony Dekker
 *
 * NEUQUANT Neural-Net quantization algorithm by Anthony Dekker, 1994.
 * See "Kohonen neural networks for optimal colour quantization"
 * in "Network: Computation in Neural Systems" Vol. 5 (1994) pp 351-367.
 * for a discussion of the algorithm.
 * See also  http://members.ozemail.com.au/~dekker/NEUQUANT.HTML
 *
 * Any party obtaining a copy of these files from the author, directly or
 * indirectly, is granted, free of charge, a full and unrestricted irrevocable,
 * world-wide, paid up, royalty-free, nonexclusive right and license to deal
 * in this software and documentation files (the "Software"), including without
 * limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons who receive
 * copies from any such party to do so, with the only requirement being
 * that this copyright notice remain intact.
 *
 * (JavaScript port 2012 by Johan Nordberg)
 */

/*
  Constructor: NeuQuant

  Arguments:

  pixels - array of pixels in RGB format
  samplefac - sampling factor 1 to 30 where lower is better quality

  >
  > pixels = [r, g, b, r, g, b, r, g, b, ..]
  >
*/
class NeuQuant {
  // number of learning cycles
  private static readonly ncycles: number = 100;
  // number of colors used
  private static readonly netsize: number = 256;
  private static readonly maxnetpos: number = NeuQuant.netsize - 1;

  // defs for freq and bias
  // bias for colour values
  private static readonly netbiasshift: number = 4;
  // bias for fractions
  private static readonly intbiasshift: number = 16;
  private static readonly intbias: number = (1 << NeuQuant.intbiasshift);
  private static readonly gammashift: number = 10;
  private static readonly gamma: number = (1 << NeuQuant.gammashift);
  private static readonly betashift: number = 10;
  /* beta = 1/1024 */
  private static readonly beta: number = (NeuQuant.intbias >> NeuQuant.betashift);
  private static readonly betagamma: number = (NeuQuant.intbias << (NeuQuant.gammashift - NeuQuant.betashift));

  // defs for decreasing radius factor
  // for 256 cols, radius starts
  private static readonly initrad: number = (NeuQuant.netsize >> 3);
  // at 32.0 biased by 6 bits
  private static readonly radiusbiasshift: number = 6;
  private static readonly radiusbias: number = (1 << NeuQuant.radiusbiasshift);
  //and decreases by a
  private static readonly initradius: number = (NeuQuant.initrad * NeuQuant.radiusbias);
  // factor of 1/30 each cycle
  private static readonly radiusdec: number = 30;

  // defs for decreasing alpha factor
  // alpha starts at 1.0
  private static readonly alphabiasshift: number = 10;
  private static readonly initalpha: number = (1 << NeuQuant.alphabiasshift);

  /* radbias and alpharadbias used for radpower calculation */
  private static readonly radbiasshift: number = 8;
  private static readonly radbias: number = (1 << NeuQuant.radbiasshift);
  private static readonly alpharadbshift: number = (NeuQuant.alphabiasshift + NeuQuant.radbiasshift);
  private static readonly alpharadbias: number = (1 << NeuQuant.alpharadbshift);

  // four primes near 500 - assume no image has a length so large that it is
  // divisible by all four primes
  private static readonly prime1: number = 499;
  private static readonly prime2: number = 491;
  private static readonly prime3: number = 487;
  private static readonly prime4: number = 503;
  private static readonly minpicturebytes: number = (3 * NeuQuant.prime4);

  // int[netsize][4]
  private network: Float64Array[];
  // for network lookup - really 256
  private netindex: Int32Array;

  // bias and freq arrays for learning
  private bias: Int32Array;
  private freq: Int32Array;
  private radpower: Int32Array;

  private pixels: Uint8Array;
  private samplefac: number;

  constructor(pixels: Uint8Array, samplefac: number) {
    this.pixels = pixels;
    this.samplefac = samplefac;
    this.network = [];
    this.netindex = new Int32Array(256);
    this.bias = new Int32Array(NeuQuant.netsize);
    this.freq = new Int32Array(NeuQuant.netsize);
    this.radpower = new Int32Array(NeuQuant.netsize >> 3);
  }

  /*
    Private Method: init

    sets up arrays
  */
  private init(): void {
    this.network = [];
    this.netindex = new Int32Array(256);
    this.bias = new Int32Array(NeuQuant.netsize);
    this.freq = new Int32Array(NeuQuant.netsize);
    this.radpower = new Int32Array(NeuQuant.netsize >> 3);

    let i: number;
    let v: number;
    for (i = 0; i < NeuQuant.netsize; i++) {
      v = (i << (NeuQuant.netbiasshift + 8)) / NeuQuant.netsize;
      this.network[i] = new Float64Array([v, v, v, 0]);
      //this.network[i] = [v, v, v, 0]
      this.freq[i] = NeuQuant.intbias / NeuQuant.netsize;
      this.bias[i] = 0;
    }
  }

  /*
    Private Method: unbiasnet

    unbiases network to give byte values 0..255 and record position i to prepare for sort
  */
  private unbiasnet(): void {
    for (let i: number = 0; i < NeuQuant.netsize; i++) {
      this.network[i][0] >>= NeuQuant.netbiasshift;
      this.network[i][1] >>= NeuQuant.netbiasshift;
      this.network[i][2] >>= NeuQuant.netbiasshift;
      this.network[i][3] = i; // record color number
    }
  }

  /*
    Private Method: altersingle

    moves neuron *i* towards biased (b,g,r) by factor *alpha*
  */
  private altersingle(alpha: number, i: number, b: number, g: number, r: number): void {
    this.network[i][0] -= (alpha * (this.network[i][0] - b)) / NeuQuant.initalpha;
    this.network[i][1] -= (alpha * (this.network[i][1] - g)) / NeuQuant.initalpha;
    this.network[i][2] -= (alpha * (this.network[i][2] - r)) / NeuQuant.initalpha;
  }

  /*
    Private Method: alterneigh

    moves neurons in *radius* around index *i* towards biased (b,g,r) by factor *alpha*
  */
  private alterneigh(radius: number, i: number, b: number, g: number, r: number): void {
    const lo: number = Math.abs(i - radius);
    const hi: number = Math.min(i + radius, NeuQuant.netsize);

    let j: number = i + 1;
    let k: number = i - 1;
    let m: number = 1;

    let p: Float64Array;
    let a: number;
    while ((j < hi) || (k > lo)) {
      a = this.radpower[m++];

      if (j < hi) {
        p = this.network[j++];
        p[0] -= (a * (p[0] - b)) / NeuQuant.alpharadbias;
        p[1] -= (a * (p[1] - g)) / NeuQuant.alpharadbias;
        p[2] -= (a * (p[2] - r)) / NeuQuant.alpharadbias;
      }

      if (k > lo) {
        p = this.network[k--];
        p[0] -= (a * (p[0] - b)) / NeuQuant.alpharadbias;
        p[1] -= (a * (p[1] - g)) / NeuQuant.alpharadbias;
        p[2] -= (a * (p[2] - r)) / NeuQuant.alpharadbias;
      }
    }
  }

  /*
    Private Method: contest

    searches for biased BGR values
  */
  private contest(b: number, g: number, r: number): number {
    /*
      finds closest neuron (min dist) and updates freq
      finds best neuron (min dist-bias) and returns position
      for frequently chosen neurons, freq[i] is high and bias[i] is negative
      bias[i] = gamma * ((1 / netsize) - freq[i])
    */

    let bestd: number = ~(1 << 31);
    let bestbiasd: number = bestd;
    let bestpos: number = -1;
    let bestbiaspos: number = bestpos;

    let i: number;
    let n: Float64Array;
    let dist: number;
    let biasdist: number;
    let betafreq: number;
    for (i = 0; i < NeuQuant.netsize; i++) {
      n = this.network[i];

      dist = Math.abs(n[0] - b) + Math.abs(n[1] - g) + Math.abs(n[2] - r);
      if (dist < bestd) {
        bestd = dist;
        bestpos = i;
      }

      biasdist = dist - ((this.bias[i]) >> (NeuQuant.intbiasshift - NeuQuant.netbiasshift));
      if (biasdist < bestbiasd) {
        bestbiasd = biasdist;
        bestbiaspos = i;
      }

      betafreq = (this.freq[i] >> NeuQuant.betashift);
      this.freq[i] -= betafreq;
      this.bias[i] += (betafreq << NeuQuant.gammashift);
    }

    this.freq[bestpos] += NeuQuant.beta;
    this.bias[bestpos] -= NeuQuant.betagamma;

    return bestbiaspos;
  }

  /*
    Private Method: inxbuild

    sorts network and builds netindex[0..255]
  */
  private inxbuild(): void {
    let i: number;
    let j: number;
    let p: Float64Array;
    let q: Float64Array;
    let smallpos: number;
    let smallval: number;
    let previouscol: number = 0;
    let startpos: number = 0;
    for (i = 0; i < NeuQuant.netsize; i++) {
      p = this.network[i];
      smallpos = i;
      smallval = p[1]; // index on g
      // find smallest in i..netsize-1
      for (j = i + 1; j < NeuQuant.netsize; j++) {
        q = this.network[j];
        if (q[1] < smallval) { // index on g
          smallpos = j;
          smallval = q[1]; // index on g
        }
      }
      q = this.network[smallpos];
      // swap p (i) and q (smallpos) entries
      if (i != smallpos) {
        j = q[0];   q[0] = p[0];   p[0] = j;
        j = q[1];   q[1] = p[1];   p[1] = j;
        j = q[2];   q[2] = p[2];   p[2] = j;
        j = q[3];   q[3] = p[3];   p[3] = j;
      }
      // smallval entry is now in position i

      if (smallval != previouscol) {
        this.netindex[previouscol] = (startpos + i) >> 1;
        for (j = previouscol + 1; j < smallval; j++)
          this.netindex[j] = i;
        previouscol = smallval;
        startpos = i;
      }
    }
    this.netindex[previouscol] = (startpos + NeuQuant.maxnetpos) >> 1;
    for (j = previouscol + 1; j < 256; j++)
      this.netindex[j] = NeuQuant.maxnetpos; // really 256
  }

  /*
    Private Method: inxsearch

    searches for BGR values 0..255 and returns a color index
  */
  private inxsearch(b: number, g: number, r: number): number {
    let a: number;
    let p: Float64Array;
    let dist: number;

    let bestd: number = 1000; // biggest possible dist is 256*3
    let best: number = -1;

    let i: number = this.netindex[g]; // index on g
    let j: number = i - 1; // start at netindex[g] and work outwards

    while ((i < NeuQuant.netsize) || (j >= 0)) {
      if (i < NeuQuant.netsize) {
        p = this.network[i];
        dist = p[1] - g; // inx key
        if (dist >= bestd) i = NeuQuant.netsize; // stop iter
        else {
          i++;
          if (dist < 0) dist = -dist;
          a = p[0] - b; if (a < 0) a = -a;
          dist += a;
          if (dist < bestd) {
            a = p[2] - r; if (a < 0) a = -a;
            dist += a;
            if (dist < bestd) {
              bestd = dist;
              best = p[3];
            }
          }
        }
      }
      if (j >= 0) {
        p = this.network[j];
        dist = g - p[1]; // inx key - reverse dif
        if (dist >= bestd) j = -1; // stop iter
        else {
          j--;
          if (dist < 0) dist = -dist;
          a = p[0] - b; if (a < 0) a = -a;
          dist += a;
          if (dist < bestd) {
            a = p[2] - r; if (a < 0) a = -a;
            dist += a;
            if (dist < bestd) {
              bestd = dist;
              best = p[3];
            }
          }
        }
      }
    }

    return best;
  }

  /*
    Private Method: learn

    "Main Learning Loop"
  */
  private learn(): void {
    let i: number;

    const lengthcount: number = this.pixels.length;
    const alphadec: number = 30 + ((this.samplefac - 1) / 3);
    const samplepixels: number = lengthcount / (3 * this.samplefac);
    let delta: number = ~~(samplepixels / NeuQuant.ncycles);
    let alpha: number = NeuQuant.initalpha;
    let radius: number = NeuQuant.initradius;

    let rad: number = radius >> NeuQuant.radiusbiasshift;

    if (rad <= 1) rad = 0;
    for (i = 0; i < rad; i++)
      this.radpower[i] = alpha * (((rad * rad - i * i) * NeuQuant.radbias) / (rad * rad));

    let step: number;
    if (lengthcount < NeuQuant.minpicturebytes) {
      this.samplefac = 1;
      step = 3;
    } else if ((lengthcount % NeuQuant.prime1) !== 0) {
      step = 3 * NeuQuant.prime1;
    } else if ((lengthcount % NeuQuant.prime2) !== 0) {
      step = 3 * NeuQuant.prime2;
    } else if ((lengthcount % NeuQuant.prime3) !== 0)  {
      step = 3 * NeuQuant.prime3;
    } else {
      step = 3 * NeuQuant.prime4;
    }

    let b: number;
    let g: number;
    let r: number;
    let j: number;
    let pix: number = 0; // current pixel

    i = 0;
    while (i < samplepixels) {
      b = (this.pixels[pix] & 0xff) << NeuQuant.netbiasshift;
      g = (this.pixels[pix + 1] & 0xff) << NeuQuant.netbiasshift;
      r = (this.pixels[pix + 2] & 0xff) << NeuQuant.netbiasshift;

      j = this.contest(b, g, r);

      this.altersingle(alpha, j, b, g, r);
      if (rad !== 0) this.alterneigh(rad, j, b, g, r); // alter neighbours

      pix += step;
      if (pix >= lengthcount) pix -= lengthcount;

      i++;

      if (delta === 0) delta = 1;
      if (i % delta === 0) {
        alpha -= alpha / alphadec;
        radius -= radius / NeuQuant.radiusdec;
        rad = radius >> NeuQuant.radiusbiasshift;

        if (rad <= 1) rad = 0;
        for (j = 0; j < rad; j++)
          this.radpower[j] = alpha * (((rad * rad - j * j) * NeuQuant.radbias) / (rad * rad));
      }
    }
  }

  /*
    Method: buildColormap

    1. initializes network
    2. trains it
    3. removes misconceptions
    4. builds colorindex
  */
  public buildColormap(): void {
    this.init();
    this.learn();
    this.unbiasnet();
    this.inxbuild();
  }

  /*
    Method: getColormap

    builds colormap from the index

    returns array in the format:

    >
    > [r, g, b, r, g, b, r, g, b, ..]
    >
  */
  public getColormap(): number[] {
    const map: number[] = [];
    const index: number[] = [];

    for (let i: number = 0; i < NeuQuant.netsize; i++)
      index[this.network[i][3]] = i;

    let k: number = 0;
    for (let l: number = 0; l < NeuQuant.netsize; l++) {
      const j: number = index[l];
      map[k++] = (this.network[j][0]);
      map[k++] = (this.network[j][1]);
      map[k++] = (this.network[j][2]);
    }
    return map;
  }

  /*
    Method: lookupRGB

    looks for the closest *r*, *g*, *b* color in the map and
    returns its index
  */
  public lookupRGB(b: number, g: number, r: number): number {
    return this.inxsearch(b, g, r);
  }
}

export default NeuQuant
