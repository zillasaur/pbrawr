package MyEvent;
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

sub Id {
  my ($self, $b) = @_;
  $self->{id} = $b if defined $b;
  return $self->{id};
}

sub Date {
  my ($self, $b) = @_;
  $self->{date} = $b if defined $b;
  return $self->{date};
}

sub Description {
  my ($self, $b) = @_;
  $self->{description} = $b if defined $b;
  return $self->{description};
}

sub Where {
  my ($self, $b) = @_;
  $self->{where} = $b if defined $b;
  return $self->{where} || " ";
}

sub When {
  my ($self, $b) = @_;
  $self->{when} = $b if defined $b;
  return $self->{when} || " ";
}

sub Who {
  my ($self, @p) = @_;
  $self->{who} = \@p if (scalar @p);
  return @{$self->{who}};
}

sub AddPlayer {
  my ($self, $p) = @_;
  if (defined $self->{who}) {
      my @w = @{$self->{who}};
      return if (scalar (grep {$p eq $_} @w) > 0);
  } else {
      $self->{who} = [];
  }
  push @{$self->{who}}, $p;
}

sub RemovePlayer {
  my ($self, $p) = @_;
  if (defined $self->{who}) {
      my @w = @{$self->{who}};
      my @nw = grep { $p ne $_ } @w;
      $self->{who} = \@nw;
  }
}

sub XML {
    my ($self) = @_;
    my $out = "<event>";
    foreach (qw(id description where when)) {
        my $esc = $self->{$_};
#        $esc =~ s/[^A-Za-z0-9,\/.:;?%"@#!&*()-=+ <>~`'\n$]//g;
        $esc =~ s/\n/<br>/g;
        $esc = escapeHTML($esc);
        $out .= "<$_>$esc</$_>";
    }
    $out .= "<who>".join(":", $self->Who())."</who>";
    $out .= "</event>\n";
    return $out;
}


1;
