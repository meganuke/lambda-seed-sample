import {InvokeCommandOutput, Lambda} from '@aws-sdk/client-lambda';
import {TextDecoder} from 'util';

export const executeLambda = async (
  function2Execute: Lambda,
  parameters: any,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    function2Execute.invoke(
      parameters,
      (err: any, data?: InvokeCommandOutput | undefined) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          const response = JSON.parse(new TextDecoder().decode(data!.Payload));
          if (response.errorType) {
            console.error(response);
            return reject(response.errorMessage);
          } else {
            console.log('lambda call response: ', response);
            return resolve(response);
          }
        }
      },
    );
  });
};
