import {NextFunction, Request, Response} from 'express';

function errorMiddleware(
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction
) {
  const status = 500;
  const message = error.message || 'Something went wrong';

  console.log(
    `Error occurred: name:, ${
      error.name
    }, message: ${error.message}, stack: ${
      error.stack
    }, full error obj: ${JSON.stringify(error, null, 2)}`
  );

  response.status(status).send({
    status,
    message,
  });
}

export {errorMiddleware};
