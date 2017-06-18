package Player;
use CGI qw(escapeHTML);

sub new {
  my $class = shift;
  my $self = {};
  if (ref $_[0]) {
      $self = bless $_[0], $class;
  } else {
      $self = bless $self, $class;
  }
  return $self;
}

# can't modify id
sub Id {
  my ($self) = @_;
  return $self->{id};
}

sub Name {
  my ($self, $b) = @_;
  $self->{name} = $b if defined $b;
  return $self->{name};
}

sub Email {
  my ($self, $b) = @_;
  $self->{email} = $b if defined $b;
  return $self->{email};
}

sub Team {
  my ($self, $b) = @_;
  $self->{team} = $b if defined $b;
  return $self->{team};
}

sub Phone {
  my ($self, $b) = @_;
  $self->{phone} = $b if defined $b;
  return $self->{phone};
}

sub XML {
    my ($self) = @_;
    foreach (qw(email team phone)) {
	$self->{$_} = "" unless defined $self->{$_} 
    }
    my $o = "<player>";
    $o .= "<$_>".escapeHTML($self->{$_})."</$_>" foreach qw(name email team phone);
    $o .= "</player>\n";
    return $o;
}
1;
