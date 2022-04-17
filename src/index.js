import {
  recoverTypedSignature,
  signTypedData,
  TypedDataUtils,
  typedSignatureHash,
  SignTypedDataVersion,
} from 'signtypeddata-v5';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';

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

      console.log('we got a coin type node', coinTypeNode);
      const addressKeyDeriver = getBIP44AddressKeyDeriver(coinTypeNode);
      console.log('we have a deriver now', addressKeyDeriver);

      // TODO: Extreme hack below here:
      // Just working for address at index 0 for now:
      // TODO: Figure out how to derive a 32 byte private key from these 64 bytes...
      // For now gonna just slice it b/c I'm experimenting...
      const privateKey = addressKeyDeriver(0).slice(0, 32);

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

// From https://stackoverflow.com/a/21797381
function base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
