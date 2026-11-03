namespace Payment.API.Services;

public interface IVietQrService
{
    VietQrInfo GenerateTopUpQr(string orderCode, decimal amount, string? note = null);
}

public record VietQrInfo(
    string BankName,
    string BankBin,
    string AccountNumber,
    string AccountName,
    decimal Amount,
    string TransferContent,
    string QrImageUrl
);

public class VietQrService : IVietQrService
{
    private readonly string _bankName;
    private readonly string _bankBin;
    private readonly string _accountNumber;
    private readonly string _accountName;

    public VietQrService(IConfiguration configuration)
    {
        _bankName = configuration["PaymentSettings:BankName"] ?? "MBBank (Napas 247)";
        _bankBin = configuration["PaymentSettings:BankBin"] ?? "970422";
        _accountNumber = configuration["PaymentSettings:AccountNumber"] ?? "0388888888";
        _accountName = configuration["PaymentSettings:AccountName"] ?? "NEXPAY FINTECH ESCROW";
    }

    public VietQrInfo GenerateTopUpQr(string orderCode, decimal amount, string? note = null)
    {
        var cleanContent = Uri.EscapeDataString(orderCode);
        var cleanName = Uri.EscapeDataString(_accountName);
        var amountInt = (long)amount;

        // Standard VietQR Quick Link URL (EMVCo compliant)
        var qrUrl = $"https://img.vietqr.io/image/{_bankBin}-{_accountNumber}-compact2.png?amount={amountInt}&addInfo={cleanContent}&accountName={cleanName}";

        return new VietQrInfo(
            BankName: _bankName,
            BankBin: _bankBin,
            AccountNumber: _accountNumber,
            AccountName: _accountName,
            Amount: amount,
            TransferContent: orderCode,
            QrImageUrl: qrUrl
        );
    }
}

