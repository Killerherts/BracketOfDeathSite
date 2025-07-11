"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env.test' });
process.env.NODE_ENV = 'test';
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
jest.setTimeout(30000);
afterEach(() => {
    jest.clearAllMocks();
});
//# sourceMappingURL=setup.js.map