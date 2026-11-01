namespace Wallet.Domain.Exceptions;

public class WalletDomainException : Exception
{
    public WalletDomainException(string message) : base(message)
    {
    }
}

