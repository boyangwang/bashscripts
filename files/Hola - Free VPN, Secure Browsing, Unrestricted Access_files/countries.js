// LICENSE_CODE ZON
'use strict'; /*jslint node:true, es5:true, browser:true*/
(function(){
var define;
var is_node = typeof module=='object' && module.exports;
if (!is_node)
    define = self.define;
else
    define = require('../../util/require_node.js').define(module, '../');
define(['underscore', '/util/util.js'], function(_, zutil){
var E = {};
E.ports_offset = 24000;
E.ports = {
    af: {port: 0},
    ax: {port: 1},
    al: {port: 2},
    dz: {port: 3},
    as: {port: 4},
    ad: {port: 5},
    ao: {port: 6},
    ai: {port: 7},
    aq: {port: 8},
    ag: {port: 9},
    ar: {port: 10},
    am: {port: 11},
    aw: {port: 12},
    au: {port: 13},
    at: {port: 14},
    az: {port: 15},
    bs: {port: 16},
    bh: {port: 17},
    bd: {port: 18},
    bb: {port: 19},
    by: {port: 20},
    be: {port: 21},
    bz: {port: 22},
    bj: {port: 23},
    bm: {port: 24},
    bt: {port: 25},
    bo: {port: 26},
    bq: {port: 27},
    ba: {port: 28},
    bw: {port: 29},
    bv: {port: 30},
    br: {port: 31},
    io: {port: 32},
    bn: {port: 33},
    bg: {port: 34},
    bf: {port: 35},
    bi: {port: 36},
    kh: {port: 37},
    cm: {port: 38},
    ca: {port: 39},
    cv: {port: 40},
    ky: {port: 41},
    cf: {port: 42},
    td: {port: 43},
    cl: {port: 44},
    cn: {port: 45},
    cx: {port: 46},
    cc: {port: 47},
    co: {port: 48},
    km: {port: 49},
    cg: {port: 50},
    cd: {port: 51},
    ck: {port: 52},
    cr: {port: 53},
    ci: {port: 54},
    hr: {port: 55},
    cu: {port: 56},
    cw: {port: 57},
    cy: {port: 58},
    cz: {port: 59},
    dk: {port: 60},
    dj: {port: 61},
    dm: {port: 62},
    do: {port: 63},
    ec: {port: 64},
    eg: {port: 65},
    sv: {port: 66},
    gq: {port: 67},
    er: {port: 68},
    ee: {port: 69},
    et: {port: 70},
    fk: {port: 71},
    fo: {port: 72},
    fj: {port: 73},
    fi: {port: 74},
    fr: {port: 75},
    gf: {port: 76},
    pf: {port: 77},
    tf: {port: 78},
    ga: {port: 79},
    gm: {port: 80},
    ge: {port: 81},
    de: {port: 82},
    gh: {port: 83},
    gi: {port: 84},
    gr: {port: 85},
    gl: {port: 86},
    gd: {port: 87},
    gp: {port: 88},
    gu: {port: 89},
    gt: {port: 90},
    gg: {port: 91},
    gn: {port: 92},
    gw: {port: 93},
    gy: {port: 94},
    ht: {port: 95},
    hm: {port: 96},
    va: {port: 97},
    hn: {port: 98},
    hk: {port: 99},
    hu: {port: 100},
    is: {port: 101},
    in: {port: 102},
    id: {port: 103},
    ir: {port: 104},
    iq: {port: 105},
    ie: {port: 106},
    im: {port: 107},
    // il: {port: 108}, not supported
    it: {port: 109},
    jm: {port: 110},
    jp: {port: 111},
    je: {port: 112},
    jo: {port: 113},
    kz: {port: 114},
    ke: {port: 115},
    ki: {port: 116},
    kp: {port: 117},
    kr: {port: 118},
    kw: {port: 119},
    kg: {port: 120},
    la: {port: 121},
    lv: {port: 122},
    lb: {port: 123},
    ls: {port: 124},
    lr: {port: 125},
    ly: {port: 126},
    li: {port: 127},
    lt: {port: 128},
    lu: {port: 129},
    mo: {port: 130},
    mk: {port: 131},
    mg: {port: 132},
    mw: {port: 133},
    my: {port: 134},
    mv: {port: 135},
    ml: {port: 136},
    mt: {port: 137},
    mh: {port: 138},
    mq: {port: 139},
    mr: {port: 140},
    mu: {port: 141},
    yt: {port: 142},
    mx: {port: 143},
    fm: {port: 144},
    md: {port: 145},
    mc: {port: 146},
    mn: {port: 147},
    me: {port: 148},
    ms: {port: 149},
    ma: {port: 150},
    mz: {port: 151},
    mm: {port: 152},
    na: {port: 153},
    nr: {port: 154},
    np: {port: 155},
    nl: {port: 156},
    nc: {port: 157},
    nz: {port: 158},
    ni: {port: 159},
    ne: {port: 160},
    ng: {port: 161},
    nu: {port: 162},
    nf: {port: 163},
    mp: {port: 164},
    no: {port: 165},
    om: {port: 166},
    pk: {port: 167},
    pw: {port: 168},
    ps: {port: 169},
    pa: {port: 170},
    pg: {port: 171},
    py: {port: 172},
    pe: {port: 173},
    ph: {port: 174},
    pn: {port: 175},
    pl: {port: 176},
    pt: {port: 177},
    pr: {port: 178},
    qa: {port: 179},
    re: {port: 180},
    ro: {port: 181},
    ru: {port: 182},
    rw: {port: 183},
    bl: {port: 184},
    sh: {port: 185},
    kn: {port: 186},
    lc: {port: 187},
    mf: {port: 188},
    pm: {port: 189},
    vc: {port: 190},
    ws: {port: 191},
    sm: {port: 192},
    st: {port: 193},
    sa: {port: 194},
    sn: {port: 195},
    rs: {port: 196},
    sc: {port: 197},
    sl: {port: 198},
    sg: {port: 199},
    sx: {port: 200},
    sk: {port: 201},
    si: {port: 202},
    sb: {port: 203},
    so: {port: 204},
    za: {port: 205},
    gs: {port: 206},
    ss: {port: 207},
    es: {port: 208},
    lk: {port: 209},
    sd: {port: 210},
    sr: {port: 211},
    sj: {port: 212},
    sz: {port: 213},
    se: {port: 214},
    ch: {port: 215},
    sy: {port: 216},
    tw: {port: 217},
    tj: {port: 218},
    tz: {port: 219},
    th: {port: 220},
    tl: {port: 221},
    tg: {port: 222},
    tk: {port: 223},
    to: {port: 224},
    tt: {port: 225},
    tn: {port: 226},
    tr: {port: 227},
    tm: {port: 228},
    tc: {port: 229},
    tv: {port: 230},
    ug: {port: 231},
    ua: {port: 232},
    ae: {port: 233},
    gb: {port: 234},
    us: {port: 235},
    um: {port: 236},
    uy: {port: 237},
    uz: {port: 238},
    vu: {port: 239},
    ve: {port: 240},
    vn: {port: 241},
    vg: {port: 242},
    vi: {port: 243},
    wf: {port: 244},
    eh: {port: 245},
    ye: {port: 246},
    zm: {port: 247},
    zw: {port: 248},
};

E.add_il = function(){
    if (E.ports.il)
        return;
    E.ports.il = {'port': 108};
    E.init();
};

E.init = function(){
    // XXX arik hack: rm bext; was added to allow easy support of all countries
    // using existing obsolete api
    var pc = E.proxy_countries = {bext: []};
    _.forEach(E.ports, function(val, key){ pc.bext.push(key.toUpperCase()); });
    /* XXX arik hack: there is no flag for those countries */
    var no_flag = zutil.bool_lookup('AX BL BQ BV IO CX CC CW FK '+
        'GF TF HM YT NU NF MP PN SH MF PM '+
        'SX GS SS SJ TK UM WF ZW GP RE AQ');
    E.proxy_countries.bext = _.filter(E.proxy_countries.bext, function(c){
	return !no_flag[c]; });
};

E.init();

return E; }); }());
