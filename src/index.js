import {
  recoverTypedSignature,
  signTypedData,
  TypedDataUtils,
  typedSignatureHash,
  SignTypedDataVersion,
} from './eth-sig-util';

wallet.registerRpcMessageHandler(async (originString, requestObject) => {
  switch (requestObject.method) {
    case 'signTypedData_v5':
      const typedMessage = requestObject.params[0];

      const consent = await wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: `Signature Requested`,
            description: `From the site at ${originString}`,
            textAreaContent:
              'This is the raw proposed signature data, it isn\'t going to be very readable here just yet, but it will get better, and it\'s a lot better than nothing:\n\n' + JSON.stringify(typedMessage, null, 2),
          },
        ],
      });

      if (!consent) {
        return false;
      }

      const coinTypeNode = await wallet.request({
        method: 'snap_getBip44Entropy_60'
      });
      const privateKey = coinTypeNode.key;

      const signature = signTypedData({
        privateKey,
        data: typedMessage,
        version: SignTypedDataVersion.V4,
      });

      return signature;

    default:
      throw new Error('Method not found: ' + requestObject.method);
  }
});
