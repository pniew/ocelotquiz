import express from 'express';

export interface OceRequest extends express.Request {
    options: OceViewOptions;
}

export interface OceViewOptions {
    isAdmin: boolean;
}
